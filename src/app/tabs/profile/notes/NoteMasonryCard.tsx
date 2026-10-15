import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';

interface Props {
  id: string;
  tile?: { left: number; top: number; width: number };
  dragging: boolean;
  children: ReactNode;
}

/** Animate measured coordinates directly: masonry measures after DOM reordering,
 * so a layout snapshot from the reorder render cannot capture this movement. */
export function NoteMasonryCard({ id, tile, dragging, children }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const placed = useRef(false);
  const reducedMotion = useReducedMotion();
  const left = tile?.left;
  const top = tile?.top;
  useLayoutEffect(() => {
    if (left === undefined || top === undefined) return;
    if (!placed.current || reducedMotion) {
      x.jump(left); y.jump(top);
      placed.current = true;
      return;
    }
    const spring = { type: 'spring' as const, stiffness: 420, damping: 36 };
    const horizontal = animate(x, left, spring);
    const vertical = animate(y, top, spring);
    return () => { horizontal.stop(); vertical.stop(); };
  }, [left, top, x, y, reducedMotion]);
  return <motion.article initial={false} className="note-card" data-note-id={id} data-dragging={dragging}
    style={{ x, y, width: tile?.width, visibility: tile ? 'visible' : 'hidden' }}>
    {children}
  </motion.article>;
}
