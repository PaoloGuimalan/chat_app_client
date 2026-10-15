import { useLayoutEffect, useRef, useState } from 'react';

interface Tile { left: number; top: number; width: number }
interface Layout { tiles: Map<string, Tile>; height: number }

/** Pack each next note into the shortest column; DOM order remains sort order. */
export function useNoteMasonry(ids: string[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>({ tiles: new Map(), height: 0 });
  const identity = ids.join(',');
  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const measure = () => {
      const available = grid.clientWidth || grid.getBoundingClientRect().width || 600;
      const gap = available < 600 ? 10 : 16;
      const columns = Math.max(2, Math.floor((available + gap) / (230 + gap)));
      const width = (available - gap * (columns - 1)) / columns;
      const heights = Array(columns).fill(0) as number[];
      const tiles = new Map<string, Tile>();
      for (const card of grid.querySelectorAll<HTMLElement>('[data-note-id]')) {
        // Measure at the column width before computing its wrapped height.
        card.style.width = `${width}px`;
        const column = heights.indexOf(Math.min(...heights));
        tiles.set(card.dataset.noteId!, { left: column * (width + gap), top: heights[column], width });
        heights[column] += card.offsetHeight + gap;
      }
      const height = tiles.size ? Math.max(...heights) - gap : 0;
      setLayout(previous => {
        const unchanged = previous.height === height && previous.tiles.size === tiles.size && [...tiles].every(([id, tile]) => {
          const old = previous.tiles.get(id);
          return old?.left === tile.left && old?.top === tile.top && old?.width === tile.width;
        });
        return unchanged ? previous : { tiles, height };
      });
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(grid);
    grid.querySelectorAll('[data-note-id]').forEach(card => observer?.observe(card));
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [identity]);
  return { ref, ...layout };
}
