import { useEffect, useRef, useState } from "react";
import {
  getAnalyser,
  subscribeCapturing,
} from "@/reusables/hooks/mediaVisualizerBus";

// Target width per bar slot (bar + gap) - bar count is derived from the
// container width each frame so bars always span it edge to edge.
const BAR_SLOT_WIDTH = 22;
const BAR_GAP = 3;
// Visualizer height matches the conversation viewport's own visible height
// (clientHeight - the on-screen viewport, not scrollHeight, which would be
// the full scrollable content height and could be huge in a long chat).
const MIN_VISUALIZER_HEIGHT = 80;
const MIN_BAR_HEIGHT = 6;
// Real spectra have frequency bands with genuinely zero energy most of the
// time. Rather than faking motion for those, bars below this (out of 255)
// are dropped entirely each frame - only bars actually reacting to the
// audio get drawn, and the remaining ones stretch to fill the width.
const ACTIVE_THRESHOLD = 12;
// Below this smoothed height a candidate is finally dropped from the
// layout - keeping it slightly above 0 lets it visibly shrink to nothing
// rather than vanishing once it's imperceptibly thin.
const FADE_EPSILON = 1;
// How fast a bar's height eases toward its target each frame (0-1, higher
// = snappier). Applied both when a bar activates (grows in) and when it
// goes silent (shrinks out), so appear/disappear is animated either way.
const EASE = 0.18;
const BAR_OPACITY = 0.95;

// Rendered as the first child of #div_conversation_content, wrapped in a
// zero-height flex item so it never pushes messages around. The canvas
// itself is position:sticky (allowed to render outside its zero-height
// parent via overflow:visible), which keeps it pinned to the scroller's
// bottom edge through the whole scroll range instead of scrolling away
// with the content. z-index:-1 keeps it painted behind the message
// bubbles, with no need to touch that container's own background.
const TabAudioVisualizerCanvas = () => {
  const [capturing, setCapturing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => subscribeCapturing(setCapturing), []);

  useEffect(() => {
    if (!capturing) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    // Eased height per candidate bin-range, keyed by index (0..candidateCount-1)
    // so a given frequency slice keeps its own smoothed value across frames
    // instead of the height jumping straight to its new target.
    let smoothed: number[] = [];

    const resize = () => {
      const viewport = canvas.closest<HTMLElement>("#div_conversation_content");
      if (!viewport) {
        return;
      }
      const height = Math.max(
        MIN_VISUALIZER_HEIGHT,
        viewport.clientHeight * 0.8,
      );
      canvas.width = viewport.clientWidth || canvas.width;
      canvas.height = height;
      canvas.style.height = `${height}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      const analyser = getAnalyser();
      if (!analyser) {
        return;
      }

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const candidateCount = Math.max(
        1,
        Math.round(canvas.width / BAR_SLOT_WIDTH),
      );
      // Real audio energy concentrates in the low end of the spectrum, so a
      // linear bin mapping only grabs a couple of bars' worth of it out of
      // hundreds of bins. A log-scale mapping spreads that active low range
      // across roughly half the candidate bars instead, and each candidate
      // takes the max over its own bin *range* (not a single point sample)
      // so wide screens with more candidates still each reflect a distinct
      // slice of the spectrum.
      const maxBinIndex = data.length - 1;
      const logMax = Math.log2(maxBinIndex + 1);
      const binBoundary = (i: number) => {
        const scale = (i / candidateCount) * logMax;
        return Math.min(maxBinIndex, Math.round(2 ** scale - 1));
      };

      if (smoothed.length !== candidateCount) {
        smoothed = new Array(candidateCount).fill(0);
      }

      // Ease each candidate's height toward its target (real height when
      // active, 0 when silent) instead of snapping straight there - a bar
      // going silent shrinks out smoothly instead of vanishing between
      // frames, and a newly active one grows in the same way.
      for (let i = 0; i < candidateCount; i++) {
        const start = binBoundary(i);
        const end = Math.max(start, binBoundary(i + 1));
        let peak = 0;
        for (let bin = start; bin <= end; bin++) {
          if (data[bin] > peak) {
            peak = data[bin];
          }
        }
        const target =
          peak >= ACTIVE_THRESHOLD
            ? MIN_BAR_HEIGHT + (peak / 255) * (canvas.height - MIN_BAR_HEIGHT)
            : 0;
        smoothed[i] += (target - smoothed[i]) * EASE;
      }

      const activeBars = smoothed
        .filter((height) => height > FADE_EPSILON)
        .sort((a, b) => a - b);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (activeBars.length === 0) {
        return;
      }

      // Gaps only sit between bars, so the first bar starts at x=0 and the
      // last bar's right edge lands exactly on canvas.width - the active
      // count varies frame to frame, so the bars stretch/shrink to keep
      // spanning the full width regardless of how many are active.
      const barWidth = Math.max(
        1,
        (canvas.width - (activeBars.length - 1) * BAR_GAP) /
          activeBars.length,
      );

      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, "#c81428");
      gradient.addColorStop(0.55, "#ff8a1e");
      gradient.addColorStop(1, "#ffffff");
      ctx.fillStyle = gradient;
      // Lower opacity so the visualizer stays a background accent rather
      // than competing with the message bubbles rendered above it.
      ctx.globalAlpha = BAR_OPACITY;

      activeBars.forEach((barHeight, i) => {
        ctx.fillRect(
          i * (barWidth + BAR_GAP),
          canvas.height - barHeight,
          barWidth,
          barHeight,
        );
      });
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [capturing]);

  if (!capturing) {
    return null;
  }

  return (
    // The wrapper is the sticky element - zero-height so it never pushes
    // messages around, pinned to the scroller's bottom edge via sticky
    // positioning. The canvas is a plain absolutely-positioned child of
    // that wrapper, so it just inherits the wrapper's pinned position.
    <div
      style={{
        position: "sticky",
        bottom: 0,
        height: 0,
        overflow: "visible",
        flexShrink: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        id="canvas_media_visualizer"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default TabAudioVisualizerCanvas;
