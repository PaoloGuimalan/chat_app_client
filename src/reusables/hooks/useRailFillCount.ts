import { useLayoutEffect, useState } from "react";

/**
 * How many fixed-width cards it takes to span a horizontal rail - used to
 * size skeleton placeholders while a rail loads.
 *
 * A hardcoded count leaves dead space on wide screens (four 168px people
 * cards fill barely half of a ~1044px row). This measures the rail ELEMENT
 * rather than the window, so page padding and the desktop sidebar are
 * accounted for automatically, and re-measures on resize.
 *
 * Ceil, not floor: letting the last card be clipped by the edge reads as
 * "this scrolls further", which is exactly how the loaded rail looks.
 *
 * Returns a callback ref - rails mount and unmount with their query, so a
 * plain ref + effect would miss the element - and the resulting count.
 */
export function useRailFillCount(
  cardWidth: number,
  {
    gap = 12,
    min = 4,
    max = 12,
  }: { gap?: number; min?: number; max?: number } = {},
) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [count, setCount] = useState(min);

  // Layout effect so the measured count lands before paint - with a plain
  // effect the rail visibly renders `min` skeletons first, then reflows.
  useLayoutEffect(() => {
    if (!node) return;

    const measure = () => {
      const width = node.clientWidth;
      if (!width) return;
      const fits = Math.ceil((width + gap) / (cardWidth + gap));
      setCount(Math.min(max, Math.max(min, fits)));
    };

    measure();
    // Only the rail's CHILDREN change here, never its own width (it is
    // parent-constrained), so this cannot feed back into itself.
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, cardWidth, gap, min, max]);

  return [setNode, count] as const;
}

export default useRailFillCount;
