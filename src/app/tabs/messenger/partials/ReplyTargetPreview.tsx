import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IoImageOutline, IoTimeOutline } from "react-icons/io5";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import type { ReplyTargetCard } from "@/reusables/vars/interfaces";
import { isReplyCardExpired } from "@/reusables/hooks/replyTargets";

/**
 * The quoted card above a message that replies to - or sends - a post, a
 * moment or a thought. Message replies keep ReplyingToPreview; this is the
 * other three, drawn from the server's `replyedtarget`.
 *
 * One layout for all three: a thumbnail (or a glyph when there is no media),
 * the author, and a line of text. A card that is expired or unavailable keeps
 * the author - so the reply still reads as "about Ana's moment" - and swaps
 * the content for a muted line saying why it is gone.
 */
function ReplyTargetPreview({
  card,
  yourReply,
}: {
  card: ReplyTargetCard;
  yourReply: boolean;
}) {
  const navigate = useNavigate();

  // Re-evaluated on a timer so a moment/thought card greys out the moment it
  // expires while the conversation is open, not on the next reload.
  const [now, setNow] = useState(() => Date.now());
  const expiresAt = card.content?.expires_at;
  useEffect(() => {
    if (!expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), remaining + 500);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  const expired = isReplyCardExpired(card, now);
  const unavailable = card.status === "unavailable";
  const live = !expired && !unavailable;

  const kindLabel =
    card.type === "moment"
      ? "Moment"
      : card.type === "thought"
        ? "Thought"
        : card.content?.shared_post_id
          ? "Shared post"
          : "Post";

  const goneLine = unavailable
    ? `This ${card.type} is no longer available`
    : `${kindLabel} expired`;

  // Only a live feed post has somewhere to go today: moments get their
  // viewer in phase 2, and a thought is entirely on the card already.
  const opensPost = live && card.type === "post";
  const openTarget = () => {
    if (opensPost) navigate(`/post/${card.content?.shared_post_id || card.id}`);
  };

  const thumbnail = live ? card.content?.thumbnail : null;
  const isVideo = !!card.content?.media_type?.startsWith("video");
  const text =
    card.type === "thought" ? card.content?.text : card.content?.caption;

  return (
    <motion.div className="div_messages_result_reply tw-items-center">
      <motion.div
        initial={{ marginLeft: yourReply ? "auto" : "0px" }}
        animate={{ marginLeft: yourReply ? "auto" : "0px" }}
        className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%] tw-opacity-[0.9]"
      >
        <button
          type="button"
          onClick={openTarget}
          disabled={!opensPost}
          className={`cl-message-bubble cl-message-bubble--quote tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-text-left tw-w-[260px] tw-max-w-[100%] tw-p-[8px] tw-rounded-[12px] ${
            opensPost ? "tw-cursor-pointer" : "tw-cursor-default"
          }`}
        >
          {card.type !== "thought" && (
            <div
              className={`tw-shrink-0 tw-overflow-hidden tw-rounded-[8px] tw-bg-[var(--surface-2)] tw-flex tw-items-center tw-justify-center ${
                card.type === "moment"
                  ? "tw-w-[40px] tw-h-[64px]"
                  : "tw-w-[52px] tw-h-[52px]"
              }`}
            >
              {thumbnail && isVideo ? (
                <video
                  src={thumbnail}
                  muted
                  playsInline
                  preload="metadata"
                  className="tw-w-full tw-h-full tw-object-cover"
                />
              ) : thumbnail ? (
                <CachedImage
                  src={thumbnail}
                  className="tw-w-full tw-h-full tw-object-cover"
                />
              ) : live ? (
                <IoImageOutline className="tw-text-[var(--text-3)]" />
              ) : (
                <IoTimeOutline className="tw-text-[var(--text-3)]" />
              )}
            </div>
          )}
          <div className="tw-flex tw-flex-col tw-min-w-0 tw-gap-[2px]">
            <span className="cl-text-meta tw-text-[var(--text-3)]">
              {kindLabel}
              {card.author?.display_name
                ? ` · ${card.author.display_name}`
                : ""}
            </span>
            {live ? (
              text ? (
                <span className="cl-text-caption tw-text-[var(--text)] ellipsis-2-lines tw-break-words">
                  {text}
                </span>
              ) : null
            ) : (
              <span className="cl-text-caption tw-text-[var(--text-3)] tw-italic">
                {goneLine}
              </span>
            )}
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}

export default ReplyTargetPreview;
