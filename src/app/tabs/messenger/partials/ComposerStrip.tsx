import { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * A strip over the composer - the reply preview, the AI reply assist row -
 * opening and closing.
 *
 * WHY ONLY HEIGHT ANIMATES
 * ------------------------
 * These used to animate `height` AND `paddingTop`/`paddingBottom` on the same
 * element, and that is what made them jerk open: the app is `border-box`, so
 * a box's height includes its padding. To animate to `height: auto`, framer
 * measures the open height when the animation STARTS - while the padding is
 * still 0 - so it ran up to a height 20px short, then snapped to the real one
 * when it handed the style back to `auto`. The padding now lives on an inner
 * box (`.cl-composer-strip__inner`), so what is measured is what is shown.
 *
 * Starts closed without animating (`initial={false}`), and opacity travels
 * with the height so the content does not pop at either end.
 */
function ComposerStrip({
  open,
  className,
  innerClassName,
  style,
  children,
}: {
  open: boolean;
  className?: string;
  /** Extra classes for the padded inner box - the picked-files row scrolls. */
  innerClassName?: string;
  style?: CSSProperties;
  /**
   * Hold the LAST content while `open` goes false, or the strip empties
   * first and closes as a blank bar - see the callers.
   */
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
      // The same duration and curve as the thread above, which shrinks and
      // grows with the strip.
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      // Padding 0 beats `#div_selected_images_container`'s, which would
      // otherwise keep a closed strip 24px tall. Not tappable while closing:
      // what it still shows is already gone.
      style={{
        ...style,
        padding: 0,
        overflow: "hidden",
        pointerEvents: open ? undefined : "none",
      }}
      id="div_selected_images_container"
      className={className}
      aria-hidden={!open}
    >
      <div
        className={`cl-composer-strip__inner${
          innerClassName ? ` ${innerClassName}` : ""
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default ComposerStrip;
