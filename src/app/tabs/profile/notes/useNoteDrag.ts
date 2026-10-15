import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export function moveNoteId(ids: string[], id: string, index: number) {
  const result = ids.filter(item => item !== id);
  result.splice(Math.max(0, Math.min(index, result.length)), 0, id);
  return result;
}

interface DragIntent {
  id: string; pointer: number; startX: number; startY: number; offsetX: number; offsetY: number;
  width: number; height: number; order: string[]; current: string[]; active: boolean;
  slots: { left: number; top: number; width: number; height: number }[];
  scroll: HTMLElement; scrollTop: number;
}
export interface NoteDragGhost { id: string; x: number; y: number; width: number; height: number }

/** Pointer capture keeps mouse and touch handles on the same drag path.
 * Stable start slots avoid cards oscillating under the pointer as they animate.
 */
export function useNoteDrag(ids: string[], enabled: boolean, commit: (id: string, before: string | null) => void) {
  const intent = useRef<DragIntent | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [ghost, setGhost] = useState<NoteDragGhost | null>(null);
  const suppressClick = useRef(false);
  const releaseClick = useRef<ReturnType<typeof setTimeout>>();
  const frame = useRef<number>();
  const point = useRef({ x: 0, y: 0 });
  const finishRef = useRef<() => void>();
  useEffect(() => () => { clearTimeout(releaseClick.current); if (frame.current) cancelAnimationFrame(frame.current); }, []);

  const update = (x: number, y: number) => {
    const drag = intent.current;
    if (!drag) return;
    point.current = { x, y };
    if (!drag.active && Math.hypot(x - drag.startX, y - drag.startY) < 6) return;
    drag.active = true;
    suppressClick.current = true;
    setGhost({ id: drag.id, x: x - drag.offsetX, y: y - drag.offsetY, width: drag.width, height: drag.height });
    const delta = drag.scroll.scrollTop - drag.scrollTop;
    let closest = 0, distance = Infinity;
    drag.slots.forEach((slot, index) => {
      const d = Math.hypot(x - slot.left - slot.width / 2, y - (slot.top - delta + slot.height / 2));
      if (d < distance) { distance = d; closest = index; }
    });
    const next = moveNoteId(drag.current, drag.id, closest);
    if (next.join() !== drag.current.join()) { drag.current = next; setOrder(next); }
  };
  const autoscroll = () => {
    const drag = intent.current;
    if (!drag?.active) return;
    const bounds = drag.scroll.getBoundingClientRect();
    const { x, y } = point.current;
    const speed = y < bounds.top + 48 ? -12 : y > bounds.bottom - 48 ? 12 : 0;
    if (speed) { drag.scroll.scrollTop += speed; update(x, y); }
    frame.current = requestAnimationFrame(autoscroll);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0 || intent.current) return;
    const target = event.target as HTMLElement;
    const handle = target.closest('[data-note-handle]');
    if (event.pointerType !== 'mouse' && !handle) return;
    if (target.closest('[data-note-no-drag]')) return;
    const card = target.closest<HTMLElement>('[data-note-id]');
    const grid = event.currentTarget;
    if (!card) return;
    const scroll = grid.closest<HTMLElement>('.notes-scroll')!;
    const rect = card.getBoundingClientRect();
    intent.current = { id: card.dataset.noteId!, pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, width: rect.width, height: rect.height,
      order: ids, current: ids, active: false, scroll, scrollTop: scroll.scrollTop,
      slots: [...grid.querySelectorAll<HTMLElement>('[data-note-id]')].map(el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; }) };
    // Leave ordinary clicks on the note button alone; capture only once moving.
    finishRef.current = () => { if (frame.current) cancelAnimationFrame(frame.current); };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = intent.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    const wasActive = drag.active;
    update(event.clientX, event.clientY);
    if (drag.active) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      if (!wasActive) frame.current = requestAnimationFrame(autoscroll);
    }
  };
  const finish = (event: ReactPointerEvent<HTMLElement>, cancelled = false) => {
    const drag = intent.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    finishRef.current?.();
    intent.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && drag.active && drag.current.join() !== drag.order.join()) {
      commit(drag.id, drag.current[drag.current.indexOf(drag.id) + 1] || null);
    }
    setGhost(null); setOrder(null);
    if (drag.active) releaseClick.current = setTimeout(() => { suppressClick.current = false; }, 100);
  };
  return { order, ghost, handlers: { onPointerDown, onPointerMove, onPointerUp: (e: ReactPointerEvent<HTMLElement>) => finish(e),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => finish(e, true),
    onClickCapture: (e: React.MouseEvent) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); } },
    onDragStart: (e: React.DragEvent) => e.preventDefault() } };
}
