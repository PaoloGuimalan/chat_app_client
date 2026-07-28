/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "@/reusables/design";
import { useScopedPortalRoot } from "@/reusables/hooks/useScopedPortalRoot";

const POPOVER_TRANSITION = { duration: 0.16, ease: "easeOut" as const };

const QUICK_REACTIONS = ["👍", "❤️", "😆", "😮", "😢", "😡"];

const QUICK_BAR_WIDTH = 300;
const QUICK_BAR_HEIGHT = 52;
const FULL_PICKER_WIDTH = 250;
const FULL_PICKER_HEIGHT = 380;
const VIEWPORT_MARGIN = 8;

function EmojiPickerHandler({
  fromSender,
  settoggleEmojiPicker,
  /** The emoji this entity currently has on the message, or null. */
  myReactionEmoji = null,
  /** Add / change / remove is decided by the owner (ContentHandler). */
  onSelect,
}: any) {
  const { theme: appTheme } = useTheme();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const portalRoot = useScopedPortalRoot(anchorRef);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      settoggleEmojiPicker(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [settoggleEmojiPicker]);

  useEffect(() => {
    const width = showFullPicker ? FULL_PICKER_WIDTH : QUICK_BAR_WIDTH;
    const height = showFullPicker ? FULL_PICKER_HEIGHT : QUICK_BAR_HEIGHT;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();

      let left = fromSender ? rect.right - width : rect.left;
      left = Math.min(
        Math.max(VIEWPORT_MARGIN, left),
        window.innerWidth - width - VIEWPORT_MARGIN,
      );

      let top = rect.bottom + 4;
      if (top + height > window.innerHeight) {
        top = Math.max(VIEWPORT_MARGIN, rect.top - height - 4);
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [fromSender, showFullPicker]);

  // Selection is handled upstream so add / change / undo all follow one rule
  // (re-picking the current emoji removes it).
  const applyReaction = (emoji: string) => {
    settoggleEmojiPicker(false);
    onSelect?.(emoji);
  };

  return (
    <div ref={anchorRef} className="tw-relative">
      {position &&
        portalRoot &&
        createPortal(
          <AnimatePresence mode="wait">
            {showFullPicker ? (
              <motion.div
                key="full"
                ref={popoverRef}
                className="cl-emoji-picker-popover"
                style={{ top: position.top, left: position.left }}
                initial={{ opacity: 0, scale: 0.9, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={POPOVER_TRANSITION}
              >
                <EmojiPicker
                  // reactionsDefaultOpen={true}
                  width="100%"
                  theme={appTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                  onEmojiClick={(emoji) => applyReaction(emoji.emoji)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="quick"
                ref={popoverRef}
                className="cl-quick-reaction-bar"
                style={{ top: position.top, left: position.left }}
                initial={{ opacity: 0, scale: 0.85, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -6 }}
                transition={POPOVER_TRANSITION}
              >
                {QUICK_REACTIONS.map((emoji, index) => {
                  const isSelected = myReactionEmoji === emoji;
                  return (
                    <motion.button
                      key={emoji}
                      type="button"
                      className="cl-quick-reaction-bar__item"
                      onClick={() => applyReaction(emoji)}
                      aria-pressed={isSelected}
                      aria-label={
                        isSelected
                          ? `Remove your ${emoji} reaction`
                          : `React with ${emoji}`
                      }
                      title={
                        isSelected ? "Tap again to undo" : `React with ${emoji}`
                      }
                      // The one you already picked is ringed so it reads as
                      // the current selection - tapping it undoes it.
                      style={
                        isSelected
                          ? {
                              background: "var(--brand-soft)",
                              boxShadow: "inset 0 0 0 2px var(--brand)",
                              borderRadius: 999,
                            }
                          : undefined
                      }
                      initial={{ opacity: 0, y: 4 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: isSelected ? 1.12 : 1,
                      }}
                      transition={{ duration: 0.12, delay: index * 0.02 }}
                      whileHover={{ scale: isSelected ? 1.2 : 1.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  );
                })}
                <motion.button
                  type="button"
                  className="cl-quick-reaction-bar__item cl-quick-reaction-bar__more"
                  onClick={() => setShowFullPicker(true)}
                  aria-label="More emojis"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.12,
                    delay: QUICK_REACTIONS.length * 0.02,
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>,
          portalRoot,
        )}
    </div>
  );
}

export default EmojiPickerHandler;
