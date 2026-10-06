/* eslint-disable @typescript-eslint/no-explicit-any */
import ReplyingToPreview from "./ReplyingToPreview";
import ReplyTargetPreview from "./ReplyTargetPreview";
import { replyCardOf } from "@/reusables/hooks/replyTargets";
import { isSystemBot, SYSTEM_BOT_DISPLAY_NAME } from "@/reusables/hooks/commands";
import type { ReplyTargetCard } from "@/reusables/vars/interfaces";

/**
 * The "replied to X" label and quote over a reply that is still SENDING.
 *
 * The same two pieces ContentHandler draws over a sent reply
 * (renderReplyLabel / renderReplyPreview), built from the replied-to message
 * as it sits in the loaded thread rather than from the server's card - so
 * the bubble does not change shape when the server's copy replaces it. A
 * pending reply used to show only its text, then grew a quote on confirm.
 *
 * A pending send is always yours, so the quote sits on your side.
 */
function PendingReplyHeader({
  target,
  members,
  commands,
  theme,
  selfEntityID,
}: {
  /** The replied-to message, or null when it is not in the loaded thread. */
  target: any | null;
  members: any[];
  commands: string[];
  theme: any;
  selfEntityID: string;
}) {
  // Same lookup as ContentHandler's getMemberInfo: senders are entity ids,
  // and usersWithInfo carries the entity id as `entityID`, its pk as `_id`.
  const nameOf = (entityID: string) => {
    if (isSystemBot(String(entityID))) return SYSTEM_BOT_DISPLAY_NAME;
    const member = members.find(
      (flt: any) =>
        String(flt.entityID) === String(entityID) ||
        String(flt._id) === String(entityID),
    );
    return member ? member.fullname.firstName : "Someone";
  };

  const label = (
    <span className="span_sender_reply_label">
      replied to{" "}
      {!target
        ? "a message"
        : target.sender === selfEntityID
          ? "your message"
          : nameOf(target.sender)}
    </span>
  );
  if (!target) return label;

  // Quoting a message that had no text of its own - a sent post, a moment or
  // thought reply - quotes the card it carried, as the server's
  // `content.attached` does for a sent reply.
  const attached: ReplyTargetCard | null =
    target.messageType === "post"
      ? (target.postcard ?? null)
      : target.messageType === "text" && !String(target.content ?? "").trim()
        ? (() => {
            const card = replyCardOf(target);
            return card && card.type !== "message" ? card : null;
          })()
        : null;

  return (
    <>
      {label}
      {attached ? (
        <ReplyTargetPreview card={attached} yourReply />
      ) : (
        <ReplyingToPreview
          cnvs={target}
          members={members}
          commands={commands}
          fromOther={selfEntityID}
          yourReply
          theme={theme}
        />
      )}
    </>
  );
}

export default PendingReplyHeader;
