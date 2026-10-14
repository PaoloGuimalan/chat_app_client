import { ReactNode, PointerEvent, KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from 'react';

// The scrollbar floats over the existing row padding and reserves no width.
export default function OverlayScrollArea({ children, maxHeight, page = false }: { children: ReactNode; maxHeight?: number; page?: boolean }) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; y: number; scrollTop: number } | null>(null);
  const [metrics, setMetrics] = useState({ scrollTop: 0, maxScroll: 0, thumbHeight: 0, thumbTop: 0, travel: 0, height: 0 });

  const sync = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const trackHeight = Math.max(0, el.clientHeight - 8);
    const thumbHeight = Math.min(trackHeight, Math.max(24, trackHeight * el.clientHeight / Math.max(1, el.scrollHeight)));
    const travel = Math.max(0, trackHeight - thumbHeight);
    setMetrics({ scrollTop: el.scrollTop, maxScroll, thumbHeight, travel,
      thumbTop: maxScroll ? el.scrollTop / maxScroll * travel : 0, height: el.clientHeight });
  }, []);

  useEffect(() => {
    sync();
    const observer = new ResizeObserver(sync);
    if (viewport.current) observer.observe(viewport.current);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, [sync]);

  const overflowing = metrics.maxScroll > 1;
  useEffect(() => {
    const target = track.current;
    const el = viewport.current;
    if (!target || !el) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 44 : event.deltaMode === 2 ? el.clientHeight : 1;
      el.scrollTop += event.deltaY * unit;
    };
    target.addEventListener('wheel', wheel, { passive: false });
    return () => target.removeEventListener('wheel', wheel);
  }, [overflowing]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !viewport.current || !track.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    if (!thumb.current?.contains(event.target as Node)) {
      const y = event.clientY - track.current.getBoundingClientRect().top;
      const fraction = Math.max(0, Math.min(1, (y - metrics.thumbHeight / 2) / Math.max(1, metrics.travel)));
      viewport.current.scrollTop = fraction * metrics.maxScroll;
    }
    drag.current = { pointerId: event.pointerId, y: event.clientY, scrollTop: viewport.current.scrollTop };
    event.currentTarget.setPointerCapture(event.pointerId);
    sync();
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId || !viewport.current) return;
    viewport.current.scrollTop = drag.current.scrollTop + (event.clientY - drag.current.y) * metrics.maxScroll / Math.max(1, metrics.travel);
    sync();
  };
  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = viewport.current;
    if (!el) return;
    const positions: Record<string, number> = { ArrowUp: el.scrollTop - 44, ArrowDown: el.scrollTop + 44,
      PageUp: el.scrollTop - metrics.height, PageDown: el.scrollTop + metrics.height, Home: 0, End: metrics.maxScroll };
    if (!(event.key in positions)) return;
    event.preventDefault();
    el.scrollTop = positions[event.key];
    sync();
  };

  return <div className={page ? "cl-account-scroll-area cl-user-scroll-area" : "cl-account-scroll-area"}>
    <div id={id} ref={viewport} className={page ? "cl-user-page scroller" : "cl-account-list scroller"} style={page ? { height: "100%" } : { maxHeight }} onScroll={sync}>
      <div ref={content} className={page ? "cl-user-page-content" : "cl-account-list-content"}>{children}</div>
    </div>
    {overflowing && <div ref={track} role="scrollbar" aria-label={page ? "Your account content scrollbar" : "Switch account scrollbar"} aria-controls={id}
      aria-orientation="vertical" aria-valuemin={0} aria-valuemax={Math.round(metrics.maxScroll)} aria-valuenow={Math.round(metrics.scrollTop)}
      tabIndex={0} className="cl-account-scrollbar" onPointerDown={startDrag} onPointerMove={moveDrag}
      onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={keyboard}>
      <div ref={thumb} className="cl-account-scrollbar-thumb" style={{ height: metrics.thumbHeight, top: metrics.thumbTop }} />
    </div>}
  </div>;
}
