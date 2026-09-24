/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoClose, IoCheckmarkCircle, IoSearch } from "react-icons/io5";
import { PiPaperPlaneTiltFill } from "react-icons/pi";

import Modal from "@/app/reusables/Modal";
import { Avatar } from "@/reusables/design";
import {
  InitConversationListRequest,
  SendPostRequest,
} from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import type { IConversation } from "@/reusables/vars/interfaces";

// Server-side cap too (SEND_POST_MAX_CONVERSATIONS in /u/sendPost) - this only
// stops the picker from offering an eleventh.
const MAX_RECIPIENTS = 10;

// How many conversations the picker loads. The list is recency-ordered, so
// the ones you are likely to send to are at the top; search narrows it.
const CONVERSATIONS_TO_LOAD = 50;

/**
 * "Send in message": pick up to 10 of your conversations - direct, group,
 * server channel or page thread - add an optional note, and the post arrives
 * in each as a message with the post as its reply card.
 *
 * Opened from the post's Share menu, next to "Share to feed". Both count as a
 * share of the post.
 */
function SendPostModal({
  postID,
  onClose,
}: {
  postID: string;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  // The chat list Home already loaded - shown immediately, then replaced by a
  // longer fetch so the picker is not limited to the first page.
  const cachedConversations: IConversation[] = useSelector(
    (state: any) => state.messageslist ?? [],
  );

  const [conversations, setConversations] =
    useState<IConversation[]>(cachedConversations);
  const [loading, setLoading] = useState(cachedConversations.length === 0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    InitConversationListRequest(1, CONVERSATIONS_TO_LOAD)
      .then((response: any) => {
        if (alive && Array.isArray(response?.items)) {
          setConversations(response.items);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) =>
      [conversation.details?.display_name, conversation.details?.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [conversations, query]);

  const atLimit = selected.length >= MAX_RECIPIENTS;

  const toggle = (conversationID: string) => {
    setSelected((prev) =>
      prev.includes(conversationID)
        ? prev.filter((id) => id !== conversationID)
        : prev.length >= MAX_RECIPIENTS
          ? prev
          : [...prev, conversationID],
    );
  };

  const alert = (type: string, content: string) =>
    dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });

  const send = () => {
    if (sending || selected.length === 0) return;
    setSending(true);

    SendPostRequest({ postID, conversationIDs: selected, content: note.trim() })
      .then((result) => {
        const failed = result.results.filter((r) => !r.status).length;
        if (result.sent === 0) {
          alert("warning", "We couldn't send this post.");
          return;
        }
        alert(
          failed > 0 ? "warning" : "success",
          failed > 0
            ? `Sent to ${result.sent}, but ${failed} couldn't be reached.`
            : result.sent === 1
              ? "Post sent."
              : `Post sent to ${result.sent} conversations.`,
        );
        onClose();
      })
      .catch(() => alert("warning", "We couldn't send this post."))
      .finally(() => setSending(false));
  };

  return (
    <Modal
      component={
        <div className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[460px] tw-max-h-[80vh] tw-p-[18px] tw-flex tw-flex-col tw-gap-[12px] tw-rounded-[12px]">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-[8px]">
            <span className="tw-flex-1 cl-text-body tw-font-semibold">
              Send in message
            </span>
            <button
              onClick={onClose}
              disabled={sending}
              aria-label="Close"
              className="tw-w-[28px] tw-h-[28px] tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer disabled:tw-opacity-[0.6]"
            >
              <IoClose style={{ fontSize: "18px", color: "var(--text)" }} />
            </button>
          </div>

          <label className="tw-w-full tw-flex tw-items-center tw-gap-[8px] tw-px-[10px] tw-py-[8px] tw-rounded-[10px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)]">
            <IoSearch style={{ color: "var(--text-3)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="tw-flex-1 tw-bg-transparent tw-border-none tw-outline-none tw-text-[var(--text)] cl-text-body-sm"
            />
          </label>

          <div className="tw-w-full tw-flex tw-justify-between cl-text-meta tw-text-[var(--text-3)]">
            <span>
              {selected.length} of {MAX_RECIPIENTS} selected
            </span>
            {atLimit && <span>{MAX_RECIPIENTS} max</span>}
          </div>

          <div className="tw-w-full tw-flex-1 tw-min-h-[120px] tw-overflow-y-auto tw-flex tw-flex-col tw-gap-[2px]">
            {loading && conversations.length === 0 ? (
              <span className="cl-text-caption tw-text-[var(--text-3)] tw-p-[8px]">
                Loading conversations…
              </span>
            ) : visible.length === 0 ? (
              <span className="cl-text-caption tw-text-[var(--text-3)] tw-p-[8px]">
                {query ? "No conversations match." : "You have no conversations yet."}
              </span>
            ) : (
              visible.map((conversation) => {
                const isSelected = selected.includes(conversation.conversationID);
                const disabled = !isSelected && atLimit;
                const isDirect = conversation.conversationType === "single";
                return (
                  <button
                    key={conversation.conversationID}
                    type="button"
                    onClick={() => toggle(conversation.conversationID)}
                    disabled={disabled || sending}
                    className="tw-w-full tw-flex tw-items-center tw-gap-[10px] tw-p-[8px] tw-rounded-[10px] tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer tw-text-left disabled:tw-opacity-[0.5] disabled:tw-cursor-not-allowed"
                  >
                    <Avatar
                      src={
                        conversation.details?.profile === "none"
                          ? null
                          : conversation.details?.profile
                      }
                      name={conversation.details?.display_name}
                      id={conversation.conversationID}
                      // Presence only for a person or page; a group or a
                      // channel has no entity to be online.
                      entityId={isDirect ? conversation.details?.entity_id : null}
                      size={36}
                    />
                    <div className="tw-flex-1 tw-min-w-0 tw-flex tw-flex-col">
                      <span className="cl-text-body-sm tw-text-[var(--text)] tw-font-semibold ellipsis-1-line">
                        {conversation.details?.display_name}
                      </span>
                      <span className="cl-text-meta tw-text-[var(--text-3)]">
                        {isDirect
                          ? "Direct message"
                          : conversation.conversationType === "group"
                            ? "Group"
                            : conversation.conversationType === "channel"
                              ? "Server channel"
                              : conversation.conversationType}
                      </span>
                    </div>
                    {isSelected ? (
                      <IoCheckmarkCircle
                        style={{ fontSize: "22px", color: "var(--brand)" }}
                      />
                    ) : (
                      <span className="tw-w-[20px] tw-h-[20px] tw-rounded-full tw-border tw-border-[var(--border-2)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={sending}
            placeholder="Add a message (optional)"
            rows={2}
            className="tw-w-full tw-p-[8px] tw-rounded-[8px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] cl-text-body-sm tw-resize-none"
          />

          <div className="tw-w-full tw-flex tw-justify-end tw-gap-[6px]">
            <button
              onClick={onClose}
              disabled={sending}
              className="cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-px-[10px] tw-rounded-[12px] cl-text-caption disabled:tw-opacity-[0.6]"
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={sending || selected.length === 0}
              className="cl-profile-action-button tw-flex tw-items-center tw-gap-[6px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-px-[12px] tw-rounded-[12px] cl-text-caption disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
            >
              <PiPaperPlaneTiltFill />
              {sending
                ? "Sending…"
                : selected.length > 1
                  ? `Send to ${selected.length}`
                  : "Send"}
            </button>
          </div>
        </div>
      }
    />
  );
}

export default SendPostModal;
