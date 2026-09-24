/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { IoClose, IoCheckmarkCircle, IoSearch } from "react-icons/io5";
import { PiPaperPlaneTiltFill } from "react-icons/pi";

import Modal from "@/app/reusables/Modal";
import { Avatar, Icon } from "@/reusables/design";
import {
  GetSendPostTargetsRequest,
  SendPostRequest,
  type SendPostTarget,
  type SendPostTargets,
} from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";

// Server-side cap too (SEND_POST_MAX_CONVERSATIONS in /u/sendPost) - this only
// stops the picker from offering an eleventh.
const MAX_RECIPIENTS = 10;

// Searching waits for a pause in typing rather than firing on every key.
const SEARCH_DELAY_MS = 250;

const keyOf = (target: SendPostTarget) => `${target.kind}:${target.id}`;

function SectionLabel({ children }: { children: string }) {
  return (
    <span style={{ padding: "10px 8px 4px", fontSize: "var(--fs-meta)", fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--text-3)" }}>
      {children}
    </span>
  );
}

function TargetRow({
  selected,
  disabled,
  onToggle,
  avatar,
  title,
  subtitle,
}: {
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="tw-w-full tw-flex tw-items-center tw-gap-[10px] tw-p-[8px] tw-rounded-[10px] tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer tw-text-left disabled:tw-opacity-[0.5] disabled:tw-cursor-not-allowed"
    >
      {avatar}
      <div className="tw-flex-1 tw-min-w-0 tw-flex tw-flex-col">
        <span className="cl-text-body-sm tw-text-[var(--text)] tw-font-semibold ellipsis-1-line">{title}</span>
        <span className="cl-text-meta tw-text-[var(--text-3)] ellipsis-1-line">{subtitle}</span>
      </div>
      {selected ? (
        <IoCheckmarkCircle style={{ fontSize: "22px", color: "var(--brand)", flex: "none" }} />
      ) : (
        <span className="tw-w-[20px] tw-h-[20px] tw-rounded-full tw-border tw-border-[var(--border-2)] tw-flex-none" />
      )}
    </button>
  );
}

/**
 * "Send in message": pick up to 10 destinations and the post arrives in each
 * as a message with the post as its reply card.
 *
 * Three sections, all filtered by the one search field:
 *   Direct messages  people and pages - anyone, not only existing chats: a
 *                    chat is opened for someone you have never messaged,
 *                    the same way starting one from their profile does.
 *   Group chats      the groups you are a member of.
 *   Servers          the server channels you are in, labelled with their
 *                    server.
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

  const [query, setQuery] = useState("");
  const [targets, setTargets] = useState<SendPostTargets | null>(null);
  const [loading, setLoading] = useState(true);
  // Remembers the NAME of what was picked, so a choice stays listed at the
  // top even after the search changes and its row scrolls out of the results.
  const [selected, setSelected] = useState<
    { target: SendPostTarget; title: string; subtitle: string; avatar: any }[]
  >([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => {
      GetSendPostTargetsRequest(query.trim())
        .then((result) => alive && setTargets(result))
        .catch(() => alive && setTargets({ direct: [], groups: [], channels: [] }))
        .finally(() => alive && setLoading(false));
    }, query ? SEARCH_DELAY_MS : 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const selectedKeys = new Set(selected.map((s) => keyOf(s.target)));
  const atLimit = selected.length >= MAX_RECIPIENTS;

  const toggle = (target: SendPostTarget, title: string, subtitle: string, avatar: any) => {
    const key = keyOf(target);
    setSelected((prev) =>
      prev.some((s) => keyOf(s.target) === key)
        ? prev.filter((s) => keyOf(s.target) !== key)
        : prev.length >= MAX_RECIPIENTS
          ? prev
          : [...prev, { target, title, subtitle, avatar }],
    );
  };

  const alert = (type: string, content: string) =>
    dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });

  const send = () => {
    if (sending || selected.length === 0) return;
    setSending(true);

    SendPostRequest({
      postID,
      targets: selected.map((s) => s.target),
      content: note.trim(),
    })
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
              : `Post sent to ${result.sent} chats.`,
        );
        onClose();
      })
      .catch((err: any) => alert("warning", err?.message || "We couldn't send this post."))
      .finally(() => setSending(false));
  };

  const row = (
    target: SendPostTarget,
    title: string,
    subtitle: string,
    avatar: React.ReactNode,
  ) => {
    const isSelected = selectedKeys.has(keyOf(target));
    return (
      <TargetRow
        key={keyOf(target)}
        selected={isSelected}
        disabled={sending || (!isSelected && atLimit)}
        onToggle={() => toggle(target, title, subtitle, avatar)}
        avatar={avatar}
        title={title}
        subtitle={subtitle}
      />
    );
  };

  const empty =
    targets &&
    targets.direct.length === 0 &&
    targets.groups.length === 0 &&
    targets.channels.length === 0;

  return (
    <Modal
      component={
        <div className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[460px] tw-max-h-[85vh] tw-p-[18px] tw-flex tw-flex-col tw-gap-[12px] tw-rounded-[12px]">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-[8px]">
            <span className="tw-flex-1 cl-text-body tw-font-semibold">Send in message</span>
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
              placeholder="Search people, pages, groups and servers"
              className="tw-flex-1 tw-bg-transparent tw-border-none tw-outline-none tw-text-[var(--text)] cl-text-body-sm"
            />
          </label>

          <div className="tw-w-full tw-flex tw-justify-between cl-text-meta tw-text-[var(--text-3)]">
            <span>{selected.length} of {MAX_RECIPIENTS} selected</span>
            {atLimit && <span>{MAX_RECIPIENTS} max</span>}
          </div>

          <div className="tw-w-full tw-flex-1 tw-min-h-[160px] tw-overflow-y-auto tw-flex tw-flex-col tw-gap-[2px]">
            {selected.length > 0 && (
              <>
                <SectionLabel>Selected</SectionLabel>
                {selected.map((s) => row(s.target, s.title, s.subtitle, s.avatar))}
              </>
            )}

            {loading && !targets ? (
              <span className="cl-text-caption tw-text-[var(--text-3)] tw-p-[8px]">Loading…</span>
            ) : empty ? (
              <span className="cl-text-caption tw-text-[var(--text-3)] tw-p-[8px]">
                {query ? "No one matches that search." : "Search for someone to send this to."}
              </span>
            ) : (
              targets && (
                <>
                  {targets.direct.length > 0 && (
                    <>
                      <SectionLabel>{query ? "People & pages" : "Direct messages"}</SectionLabel>
                      {targets.direct
                        .filter((d) => !selectedKeys.has(`entity:${d.entity_id}`))
                        .map((d) =>
                          row(
                            { kind: "entity", id: d.entity_id },
                            d.display_name,
                            d.type === "realm" ? `Page · @${d.handle}` : `@${d.handle}`,
                            <Avatar id={d.entity_id} entityId={d.entity_id} name={d.display_name} src={d.profile} size={36} kind={d.type} />,
                          ),
                        )}
                    </>
                  )}
                  {targets.groups.length > 0 && (
                    <>
                      <SectionLabel>Group chats</SectionLabel>
                      {targets.groups
                        .filter((g) => !selectedKeys.has(`conversation:${g.conversation_id}`))
                        .map((g) =>
                          row(
                            { kind: "conversation", id: g.conversation_id },
                            g.display_name,
                            "Group",
                            <Avatar id={g.conversation_id} name={g.display_name} src={g.profile} size={36} shape="rounded" />,
                          ),
                        )}
                    </>
                  )}
                  {targets.channels.length > 0 && (
                    <>
                      <SectionLabel>Servers</SectionLabel>
                      {targets.channels
                        .filter((c) => !selectedKeys.has(`conversation:${c.conversation_id}`))
                        .map((c) =>
                          row(
                            { kind: "conversation", id: c.conversation_id },
                            `# ${c.display_name}`,
                            c.server_name ? `Server · ${c.server_name}` : "Server channel",
                            <span style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--gold-soft)", color: "var(--gold-700)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                              <Icon n="dns" s={19} />
                            </span>,
                          ),
                        )}
                    </>
                  )}
                </>
              )
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={sending}
            placeholder="Add a message (optional)"
            rows={2}
            // shrink-0: a flex child under the (tall, scrolling) list, so it
            // was the one that gave way - squeezed to a sliver of a box.
            className="tw-shrink-0 tw-min-h-[64px] tw-box-border tw-w-full tw-p-[10px] tw-rounded-[8px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] cl-text-body-sm tw-resize-none"
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
              {sending ? "Sending…" : selected.length > 1 ? `Send to ${selected.length}` : "Send"}
            </button>
          </div>
        </div>
      }
    />
  );
}

export default SendPostModal;
