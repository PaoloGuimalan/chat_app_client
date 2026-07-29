/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TbLayoutBoardSplit, TbLayoutGrid } from "react-icons/tb";
import CallTileView from "./CallTileView";
import { CallTileData } from "./types";

const GAP = 8;
/** Below this a tile stops being readable — the grid starts scrolling instead. */
const MIN_TILE_W = 148;
const VIDEO_ASPECT = 16 / 9;
const AUDIO_ASPECT = 4 / 3;
/** An audio-only call is avatars, not video — don't blow them up to fill 4K. */
const MAX_AUDIO_TILE_W = 300;
/** Wide enough for a side rail; anything narrower gets a bottom strip. */
const RAIL_BREAKPOINT = 900;

interface GridMetrics {
  tileW: number;
  tileH: number;
  scroll: boolean;
}

/**
 * Picks the tile size that fills the stage best.
 *
 * For every possible column count it works out how large a tile of the target
 * aspect ratio could be, and keeps the arrangement that yields the largest
 * tile — the same "best fit" the mobile client approximates with its hardcoded
 * 1 / 2 / 2x2 cases, generalized so it also handles 9 people in a wide window.
 * Once the winner would be unreadably small the grid switches to fixed-size
 * tiles and scrolls.
 */
function computeGrid(
  count: number,
  width: number,
  height: number,
  aspect: number,
  maxTileW?: number,
): GridMetrics {
  if (count <= 0 || width <= 0 || height <= 0) {
    return { tileW: 0, tileH: 0, scroll: false };
  }

  let best = { tileW: 0, tileH: 0 };

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const availableW = (width - GAP * (cols - 1)) / cols;
    const availableH = (height - GAP * (rows - 1)) / rows;
    if (availableW <= 0 || availableH <= 0) {
      continue;
    }

    const tileW = Math.min(availableW, availableH * aspect);
    const tileH = tileW / aspect;
    if (tileW * tileH > best.tileW * best.tileH) {
      best = { tileW, tileH };
    }
  }

  if (best.tileW < MIN_TILE_W) {
    const cols = Math.max(1, Math.floor((width + GAP) / (MIN_TILE_W + GAP)));
    const tileW = (width - GAP * (cols - 1)) / cols;
    return { tileW, tileH: tileW / aspect, scroll: true };
  }

  if (maxTileW && best.tileW > maxTileW) {
    return { tileW: maxTileW, tileH: maxTileW / aspect, scroll: false };
  }

  return { ...best, scroll: false };
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const measure = () => {
      setSize((prev) =>
        prev.width === node.clientWidth && prev.height === node.clientHeight
          ? prev
          : { width: node.clientWidth, height: node.clientHeight },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    // ResizeObserver only delivers on a rendering frame, so a window resize
    // that happens while the tab isn't painting can be missed entirely.
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { ref, size };
}

/**
 * The video area of every call surface.
 *
 * Two layouts, picked automatically:
 *
 *   • Spotlight — whenever someone is sharing a screen (or a tile is pinned).
 *     The shared screen takes the whole stage and everyone else drops into a
 *     rail beside it (or a strip beneath it on a narrow window). Screen shares
 *     are what a call is about, so they win the space by default.
 *   • Grid — otherwise. Tile size is solved against the live container size so
 *     the tiles always fill the stage, whatever the participant count or the
 *     window's shape, and only start scrolling once they'd be too small to read.
 *
 * Pin/unpin (double-click a tile, or its pin button) overrides the automatic
 * choice; the header toggle switches back to the plain grid.
 */
function CallStage({ tiles }: { tiles: CallTileData[] }) {
  const { ref: bodyRef, size } = useElementSize<HTMLDivElement>();
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const [forceGrid, setForceGrid] = useState(false);
  const knownScreenKeysRef = useRef<string[]>([]);

  const screenTiles = useMemo(
    () => tiles.filter((tile) => tile.isScreen),
    [tiles],
  );

  // Drop a pin whose tile has left the call (participant hung up, screen
  // share stopped) so the stage falls back instead of showing nothing.
  useEffect(() => {
    if (pinnedKey && !tiles.some((tile) => tile.key === pinnedKey)) {
      setPinnedKey(null);
    }
  }, [pinnedKey, tiles]);

  // A screen share that starts *after* the user has opted back into the grid
  // still deserves the spotlight — it's new information, not the thing they
  // dismissed.
  useEffect(() => {
    const keys = screenTiles.map((tile) => tile.key);
    const previous = knownScreenKeysRef.current;
    const hasNew = keys.some((key) => !previous.includes(key));
    knownScreenKeysRef.current = keys;
    if (hasNew) {
      setForceGrid(false);
    }
  }, [screenTiles]);

  const focusTile = useMemo(() => {
    if (pinnedKey) {
      return tiles.find((tile) => tile.key === pinnedKey) ?? null;
    }
    if (forceGrid) {
      return null;
    }
    return screenTiles[0] ?? null;
  }, [forceGrid, pinnedKey, screenTiles, tiles]);

  const isSpotlight = Boolean(focusTile) && tiles.length > 1;
  const railTiles = useMemo(
    () =>
      isSpotlight ? tiles.filter((tile) => tile.key !== focusTile?.key) : [],
    [focusTile, isSpotlight, tiles],
  );

  const hasAnyVideo = tiles.some((tile) => tile.hasVideo);
  const aspect = hasAnyVideo ? VIDEO_ASPECT : AUDIO_ASPECT;
  const grid = useMemo(
    () =>
      computeGrid(
        tiles.length,
        size.width,
        size.height,
        aspect,
        hasAnyVideo ? undefined : MAX_AUDIO_TILE_W,
      ),
    [aspect, hasAnyVideo, size.height, size.width, tiles.length],
  );

  const toggleFocus = (key: string) => {
    if (focusTile?.key === key) {
      setPinnedKey(null);
      setForceGrid(true);
      return;
    }
    setPinnedKey(key);
    setForceGrid(false);
  };

  const canToggleLayout = tiles.length > 1 && (screenTiles.length > 0 || isSpotlight);
  const useRail = size.width >= RAIL_BREAKPOINT;

  return (
    <div className="cl-callstage">
      {canToggleLayout && (
        <button
          type="button"
          className="cl-callstage-layout-toggle"
          title={isSpotlight ? "Switch to grid" : "Switch to spotlight"}
          aria-label={isSpotlight ? "Switch to grid" : "Switch to spotlight"}
          onClick={() => {
            if (isSpotlight) {
              setPinnedKey(null);
              setForceGrid(true);
              return;
            }
            setForceGrid(false);
            setPinnedKey(screenTiles[0]?.key ?? tiles[0]?.key ?? null);
          }}
        >
          {isSpotlight ? <TbLayoutGrid /> : <TbLayoutBoardSplit />}
        </button>
      )}

      <div className="cl-callstage-body" ref={bodyRef}>
        {tiles.length === 0 ? (
          <div className="cl-callstage-empty cl-text-caption">
            Waiting for participants…
          </div>
        ) : isSpotlight && focusTile ? (
          <div
            className={`cl-callstage-spotlight ${
              useRail ? "is-rail" : "is-strip"
            }`}
          >
            <div className="cl-callstage-focus">
              <CallTileView
                key={focusTile.key}
                tile={focusTile}
                isFocused
                onToggleFocus={toggleFocus}
              />
            </div>
            {railTiles.length > 0 && (
              <div
                className={`t-scroll ${
                  useRail ? "cl-callstage-rail" : "cl-callstage-strip"
                }`}
              >
                {railTiles.map((tile) => (
                  <CallTileView
                    key={tile.key}
                    tile={tile}
                    variant="thumb"
                    onToggleFocus={toggleFocus}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`cl-callstage-grid t-scroll${
              grid.scroll ? " is-scrolling" : ""
            }`}
          >
            {tiles.map((tile) => (
              <div
                key={tile.key}
                className="cl-callstage-cell"
                style={{
                  width: grid.tileW ? `${grid.tileW}px` : undefined,
                  height: grid.tileH ? `${grid.tileH}px` : undefined,
                }}
              >
                <CallTileView tile={tile} onToggleFocus={toggleFocus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CallStage;
