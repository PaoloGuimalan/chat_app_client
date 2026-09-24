import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiShareFat, PiPaperPlaneTilt, PiRepeat } from "react-icons/pi";

/**
 * A post's Share action: one button, two ways to share.
 *
 *   Share to feed    - the existing repost, a new post of your own whose one
 *                      reference is this post (the NewPostModal toShare path).
 *   Send in message  - the post into up to 10 of your conversations
 *                      (SendPostModal).
 *
 * Both are shares: each bumps the post's share count and ranking once.
 */
function SharePostButton({
  onShareToFeed,
  onSendInMessage,
}: {
  onShareToFeed: () => void;
  onSendInMessage: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Closes on any click outside the button and its menu, and on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div
      ref={containerRef}
      className="tw-relative tw-flex tw-flex-1 tw-justify-center tw-items-center"
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share"
        className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
      >
        <PiShareFat style={{ fontSize: "25px", color: "var(--text-2)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="tw-absolute tw-bottom-[38px] tw-z-[20] tw-min-w-[190px] tw-p-[4px] tw-rounded-[12px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-flex tw-flex-col"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <button
              role="menuitem"
              onClick={() => choose(onShareToFeed)}
              className="tw-flex tw-items-center tw-gap-[10px] tw-px-[10px] tw-py-[8px] tw-rounded-[8px] tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer tw-text-[var(--text)] cl-text-body-sm tw-text-left"
            >
              <PiRepeat style={{ fontSize: "18px" }} />
              Share to feed
            </button>
            <button
              role="menuitem"
              onClick={() => choose(onSendInMessage)}
              className="tw-flex tw-items-center tw-gap-[10px] tw-px-[10px] tw-py-[8px] tw-rounded-[8px] tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer tw-text-[var(--text)] cl-text-body-sm tw-text-left"
            >
              <PiPaperPlaneTilt style={{ fontSize: "18px" }} />
              Send in message
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SharePostButton;
