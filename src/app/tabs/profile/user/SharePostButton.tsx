import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  PiShareFat,
  PiPaperPlaneTilt,
  PiRepeat,
  PiTimer,
} from "react-icons/pi";
import { useScopedPortalRoot } from "@/reusables/hooks/useScopedPortalRoot";

const MENU_WIDTH = 200;
// Room kept between the menu and the button, and the viewport edge.
const GAP = 8;

/**
 * A post's Share action: one button, the ways to share it.
 *
 *   Share to feed    - the existing repost, a new post of your own whose one
 *                      reference is this post (the NewPostModal toShare path).
 *   Send in message  - the post into up to 10 chats (SendPostModal).
 *   Add to Moment    - the post as a 24h Moment (CreateMomentModal's "Share
 *                      a post"). Offered only when `onAddToMoment` is given.
 *
 * All of them count as shares of the post.
 *
 * The menu is PORTALED and fixed to the button's position: rendered inside
 * the card it was cut off by the card's own overflow clipping. It opens above
 * the button when there is room, below it otherwise, and closes on scroll
 * rather than drifting away from the button it belongs to.
 */
function SharePostButton({
  onShareToFeed,
  onSendInMessage,
  onAddToMoment,
  iconSize = 25,
  className,
}: {
  onShareToFeed: () => void;
  onSendInMessage: () => void;
  onAddToMoment?: () => void;
  iconSize?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const portalRoot = useScopedPortalRoot(buttonRef);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const itemCount = onAddToMoment ? 3 : 2;
    const menuHeight = itemCount * 38 + 10;
    const left = Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - MENU_WIDTH / 2),
      window.innerWidth - MENU_WIDTH - GAP,
    );
    const above = rect.top - menuHeight - GAP >= GAP;
    setPosition(
      above
        ? { left, bottom: window.innerHeight - rect.top + GAP }
        : { left, top: rect.bottom + GAP },
    );
  }, [open, onAddToMoment]);

  // Closes on any click outside the button and its menu, on Escape, and on
  // scroll or resize (a fixed menu would otherwise float away from its button).
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  const items: { label: string; icon: React.ReactNode; action: () => void }[] = [
    { label: "Share to feed", icon: <PiRepeat style={{ fontSize: "18px" }} />, action: onShareToFeed },
    { label: "Send in message", icon: <PiPaperPlaneTilt style={{ fontSize: "18px" }} />, action: onSendInMessage },
    ...(onAddToMoment
      ? [{ label: "Add to Moment", icon: <PiTimer style={{ fontSize: "18px" }} />, action: onAddToMoment }]
      : []),
  ];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share"
        className={
          className ??
          "cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
        }
      >
        <PiShareFat style={{ fontSize: `${iconSize}px`, color: "var(--text-2)" }} />
      </button>
      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.12 }}
                className="tw-fixed tw-z-[10000] tw-p-[4px] tw-rounded-[12px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-flex tw-flex-col"
                style={{ ...position, width: MENU_WIDTH, boxShadow: "var(--shadow-md)" }}
              >
                {items.map((item) => (
                  <button
                    key={item.label}
                    role="menuitem"
                    onClick={() => choose(item.action)}
                    className="tw-flex tw-items-center tw-gap-[10px] tw-px-[10px] tw-py-[8px] tw-rounded-[8px] tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer tw-text-[var(--text)] cl-text-body-sm tw-text-left"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          portalRoot,
        )}
    </>
  );
}

export default SharePostButton;
