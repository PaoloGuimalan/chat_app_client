import {
  CSSProperties,
  ReactNode,
  UIEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "./primitives";

export interface HScrollRailProps {
  children: ReactNode;
  /** Gap between items, in px. */
  gap?: number;
  /**
   * Extra ref for the scrolling track. The rail keeps its own ref for the
   * arrows, so callers that also need to measure the track (e.g.
   * useRailFillCount sizing skeletons) pass theirs here and both are wired
   * to the same element.
   */
  trackRef?: (el: HTMLDivElement | null) => void;
  /** Names the region for screen readers, e.g. "People". */
  label?: string;
  style?: CSSProperties;
  trackStyle?: CSSProperties;
}

// Horizontal rail with arrow buttons instead of a scrollbar.
//
// The track still scrolls natively - touch swipe, trackpad and keyboard all
// keep working - the scrollbar is just hidden and the arrows drive it. Each
// arrow only renders when there is actually something to reveal on that
// side, so a rail whose contents fit shows no chrome at all.
function HScrollRail({
  children,
  gap = 12,
  trackRef,
  label,
  style,
  trackStyle,
}: HScrollRailProps) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    // 1px slack: fractional widths otherwise leave the end arrow enabled
    // forever at the true end of the track.
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Re-check whenever the track resizes OR its contents change - a rail
  // populated after a fetch would otherwise keep the arrow state it had
  // while empty.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));

    const mutation = new MutationObserver(() => {
      sync();
      Array.from(el.children).forEach((child) => observer.observe(child));
    });
    mutation.observe(el, { childList: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [sync]);

  const setRefs = (el: HTMLDivElement | null) => {
    innerRef.current = el;
    trackRef?.(el);
  };

  const scrollBy = (direction: 1 | -1) => {
    const el = innerRef.current;
    if (!el) return;
    // Just under a full viewport keeps a card of context visible across the
    // jump, so nothing is skipped between clicks.
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrowStyle = (side: "left" | "right"): CSSProperties => ({
    position: "absolute",
    [side]: -4,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text-2)",
    boxShadow: "var(--shadow-md)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  });

  return (
    <div style={{ position: "relative", ...style }}>
      {canLeft && (
        <button
          type="button"
          aria-label={label ? `Scroll ${label} left` : "Scroll left"}
          onClick={() => scrollBy(-1)}
          style={arrowStyle("left")}
        >
          <Icon n="chevron_left" s={20} c="var(--text-2)" />
        </button>
      )}

      <div
        ref={setRefs}
        onScroll={(e: UIEvent<HTMLDivElement>) => {
          void e;
          sync();
        }}
        className="cl-rail-track"
        role={label ? "group" : undefined}
        aria-label={label}
        style={{
          display: "flex",
          gap,
          overflowX: "auto",
          paddingBottom: 6,
          ...trackStyle,
        }}
      >
        {children}
      </div>

      {canRight && (
        <button
          type="button"
          aria-label={label ? `Scroll ${label} right` : "Scroll right"}
          onClick={() => scrollBy(1)}
          style={arrowStyle("right")}
        >
          <Icon n="chevron_right" s={20} c="var(--text-2)" />
        </button>
      )}
    </div>
  );
}

export default HScrollRail;
export { HScrollRail };
