import type {
  ReplyingTo,
  ReplyTargetCard,
  ReplyTargetType,
} from "@/reusables/vars/interfaces";

/**
 * What a message replies to, from its stored `replyingTo`: a bare string is
 * ALWAYS a message id; an object names its own type. Null when the message
 * replies to nothing. Mirrors the server's normalizeReplyTarget
 * (server/reusables/hooks/replyTargets.js) - the one rule, stated once.
 */
export const normalizeReplyTarget = (
  replyingTo: ReplyingTo | null | undefined,
): { type: ReplyTargetType; id: string } | null => {
  if (!replyingTo) return null;
  if (typeof replyingTo === "string") return { type: "message", id: replyingTo };
  if (typeof replyingTo === "object" && replyingTo.type && replyingTo.id) {
    return { type: replyingTo.type, id: String(replyingTo.id) };
  }
  return null;
};

/**
 * The reply card for a message. Prefers the server's `replyedtarget`; falls
 * back to the older `replyedmessage` array for a message reply from a server
 * that has not sent `replyedtarget` yet, so message quotes keep rendering
 * through a staggered deploy. Null when there is nothing to draw.
 */
// The parts of a loaded message a reply card is built from.
interface ReplySource {
  isReply?: boolean;
  replyingTo?: ReplyingTo | null;
  replyedtarget?: ReplyTargetCard | null;
  replyedmessage?: { sender?: string; isDeleted?: boolean }[];
}

export const replyCardOf = (message: ReplySource): ReplyTargetCard | null => {
  if (!message?.isReply) return null;
  if (message.replyedtarget) return message.replyedtarget;

  const target = normalizeReplyTarget(message.replyingTo);
  if (!target) return null;

  if (target.type === "message") {
    const replied = message.replyedmessage?.[0];
    if (!replied) {
      return { ...target, status: "unavailable", author: null };
    }
    return {
      ...target,
      status: replied.isDeleted ? "unavailable" : "active",
      author: {
        entity_id: String(replied.sender),
        type: "user",
        display_name: "",
        handle: "",
        profile: null,
      },
    };
  }

  // A post/moment/thought reply with no card at all: say it is unavailable
  // rather than draw nothing, so the message still reads as a reply.
  return { ...target, status: "unavailable", author: null };
};

/**
 * Expiry is also enforced on the client: a card that was active when the
 * conversation loaded stops showing a moment/thought the moment it expires,
 * without waiting for a reload.
 */
export const isReplyCardExpired = (card: ReplyTargetCard, now = Date.now()) =>
  card.status === "expired" ||
  (!!card.content?.expires_at &&
    new Date(card.content.expires_at).getTime() <= now);

/** "your moment" / "Ana's post" - the noun phrase the reply label ends with. */
export const replyTargetNoun = (type: ReplyTargetType) =>
  type === "message" ? "message" : type;
