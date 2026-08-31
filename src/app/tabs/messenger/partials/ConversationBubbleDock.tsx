/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoMdClose } from "react-icons/io";
import { Avatar } from "@/reusables/design";
import { isUserOnline } from "@/reusables/hooks/reusable";
import {
  CLOSE_MINIMIZED_CONVERSATION,
  EXPAND_MINIMIZED_CONVERSATION,
} from "@/redux/types";
import GroupChatIcon from "../../../../assets/imgs/group-chat-icon.jpg";

/** Where the hover card is pinned, in viewport coordinates. The dock scrolls,
 *  so the card is positioned `fixed` against the bubble's measured rect rather
 *  than absolutely inside the (clipping) dock. */
interface HoverAnchor {
  conversationID: string;
  top: number;
  right: number;
}

/** Plain-text one-liner for the hover card. The conversation list stores the
 *  last message's rich `content`, which the Messages list renders as HTML -
 *  here it has to come out as text, so it is parsed inertly (DOMParser never
 *  loads resources or runs scripts) rather than assigned to an innerHTML. */
function previewText(conversation: any, selfEntityID: string): string {
  if (!conversation) {
    return "";
  }
  const prefix = conversation.sender == selfEntityID ? "you: " : "";
  if (conversation.isDeleted) {
    return `${prefix}[Deleted message]`;
  }
  if (
    conversation.messageType === "text" ||
    conversation.messageType === "notif"
  ) {
    const parsed = new DOMParser().parseFromString(
      conversation.content || "",
      "text/html",
    );
    return `${prefix}${parsed.body.textContent || ""}`;
  }
  return `${prefix}Sent an attachment`;
}

/**
 * The right-edge dock of collapsed mini conversations.
 *
 * A collapsed entry keeps its slot in `minimizedconversation` - only its
 * `collapsed` flag flips - but its window UNMOUNTS, so everything drawn here
 * comes either from the `bubble` snapshot the collapse action carried or from
 * the conversation list, which the `messages_list` SSE event refreshes on every
 * incoming message and is therefore the live source for the unread count.
 */
function ConversationBubbleDock({ bubbles }: { bubbles: any[] }) {
  const dispatch = useDispatch();
  const messageslist = useSelector((state: any) => state.messageslist);
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const authentication = useSelector((state: any) => state.authentication);
  const [hovered, setHovered] = useState<HoverAnchor | null>(null);

  if (bubbles.length === 0) {
    return null;
  }

  const resolved = bubbles.map((mp: any) => {
    const listed = messageslist.find(
      (flt: any) => flt.conversationID === mp.conversationID,
    );
    const bubble = mp.bubble ?? {};
    const isGroup =
      bubble.conversationType === "group" ||
      listed?.conversationType === "group";

    return {
      conversationID: mp.conversationID,
      entityID: bubble.entity_id,
      name: bubble.display_name || listed?.groupdetails?.groupName || "",
      profile: bubble.profile || (isGroup ? GroupChatIcon : undefined),
      avatarKey: bubble.id || mp.conversationID,
      online: !isGroup && isUserOnline(activeuserslist, bubble.entity_id),
      unread: listed?.unread || 0,
      preview: previewText(listed, authentication.user.entity_id),
    };
  });

  const hoveredBubble = hovered
    ? resolved.find((flt) => flt.conversationID === hovered.conversationID)
    : null;

  return (
    <>
      <div className="cl-bubble-dock">
        {resolved.map((bubble) => (
          <div
            className="cl-bubble-dock__item"
            key={bubble.conversationID}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHovered({
                conversationID: bubble.conversationID,
                top: rect.top + rect.height / 2,
                right: window.innerWidth - rect.left + 10,
              });
            }}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              type="button"
              // title={bubble.name}
              aria-label={`Open conversation with ${bubble.name}`}
              className="cl-bubble-dock__button"
              onClick={() => {
                dispatch({
                  type: EXPAND_MINIMIZED_CONVERSATION,
                  payload: { conversationID: bubble.conversationID },
                });
                setHovered(null);
              }}
            >
              <Avatar
                id={bubble.avatarKey}
                name={bubble.name}
                src={bubble.profile}
                size={42}
              />
            </button>
            {bubble.online && <span className="cl-bubble-dock__online" />}
            {bubble.unread > 0 && (
              <span className="cl-bubble-dock__badge">
                {bubble.unread > 99 ? "99+" : bubble.unread}
              </span>
            )}
            {hovered?.conversationID === bubble.conversationID && (
              <button
                type="button"
                title="Close conversation"
                aria-label={`Close conversation with ${bubble.name}`}
                className="cl-bubble-dock__close"
                onClick={() => {
                  dispatch({
                    type: CLOSE_MINIMIZED_CONVERSATION,
                    payload: { conversationID: bubble.conversationID },
                  });
                  setHovered(null);
                }}
              >
                <IoMdClose style={{ fontSize: "12px" }} />
              </button>
            )}
          </div>
        ))}
      </div>
      {hovered && hoveredBubble && (
        <div
          className="cl-bubble-dock__card"
          style={{ top: hovered.top, right: hovered.right }}
        >
          <div className="cl-bubble-dock__card-name">{hoveredBubble.name}</div>
          {hoveredBubble.preview && (
            <div className="cl-bubble-dock__card-preview">
              {hoveredBubble.preview}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ConversationBubbleDock;

