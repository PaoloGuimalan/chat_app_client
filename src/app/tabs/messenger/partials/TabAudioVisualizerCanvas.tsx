import { useEffect, useRef, useState } from "react";
import {
  getAnalyser,
  subscribeCapturing,
  subscribeVisualizerStyle,
  VisualizerStyle,
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
const OPACITY = 0.95;
const WAVE_LINE_WIDTH = 3;
const PULSE_MIN_RADIUS_RATIO = 0.15;
const PULSE_MAX_RADIUS_RATIO = 0.65;
const LED_SEGMENT_HEIGHT = 8;
const LED_SEGMENT_GAP = 3;
const RADIAL_INNER_RATIO = 0.12;
const RADIAL_REACH_RATIO = 0.55;
const RING_SPAWN_MIN_INTERVAL = 180;
const RING_GROWTH_RATIO = 0.014;
const RING_FADE = 0.965;
const SPECTROGRAM_SCROLL_PX = 2;
const SPECTROGRAM_ROW_HEIGHT = 3;
const FIREFLY_CAP = 150;
const BLOB_POINTS = 40;
const STARBURST_INNER_RATIO = 0.08;
const VU_RADIUS_RATIO = 0.75;

const makeGradient = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
  gradient.addColorStop(0, "#c81428");
  gradient.addColorStop(0.55, "#ff8a1e");
  gradient.addColorStop(1, "#ffffff");
  return gradient;
};

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
  // Read fresh inside the draw loop rather than a dependency, so switching
  // styles mid-capture doesn't tear down the loop and reset bar smoothing.
  const styleRef = useRef<VisualizerStyle>("bars");

  useEffect(() => subscribeCapturing(setCapturing), []);
  useEffect(
    () => subscribeVisualizerStyle((style) => (styleRef.current = style)),
    [],
  );

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
    // instead of the height jumping straight to its new target. Shared by
    // the "bars" and "mirror" styles, which only differ in how they draw.
    let smoothed: number[] = [];
    // Eased overall volume level (0-1) driving the "pulse" style's radius.
    let smoothedPulse = 0;
    // "rings" style: active ripples, plus a rolling energy average used to
    // detect transients (spikes) worth spawning a new ring for.
    let rings: { radius: number; alpha: number }[] = [];
    let ringEnergyAvg = 0;
    let lastRingSpawn = 0;
    // "fireflies" style: floating particles spawned from bass energy.
    let fireflies: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
    }[] = [];
    // Eased overall volume level (0-1) driving the "vu" needle.
    let smoothedVu = 0;
    // "spectrogram" is the only style that relies on the previous frame's
    // pixels (it scrolls them instead of redrawing from scratch), so the
    // canvas is only cleared on the frame a style change lands on it.
    let lastStyle: VisualizerStyle | null = null;

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

    const computeActiveBars = (analyser: AnalyserNode) => {
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

      return smoothed.filter((height) => height > FADE_EPSILON).sort((a, b) => a - b);
    };

    const drawBars = (analyser: AnalyserNode, mirrored: boolean) => {
      const activeBars = computeActiveBars(analyser);
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

      ctx.fillStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY;

      const centerY = canvas.height / 2;
      activeBars.forEach((barHeight, i) => {
        const x = i * (barWidth + BAR_GAP);
        if (mirrored) {
          ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        } else {
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        }
      });
    };

    const drawWave = (analyser: AnalyserNode) => {
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);

      ctx.strokeStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY;
      ctx.lineWidth = WAVE_LINE_WIDTH;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      const sliceWidth = canvas.width / (timeData.length - 1);
      for (let i = 0; i < timeData.length; i++) {
        const amplitude = timeData[i] / 128 - 1; // -1..1
        const y = canvas.height / 2 + amplitude * (canvas.height / 2 - WAVE_LINE_WIDTH);
        const x = i * sliceWidth;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    const drawPulse = (analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const target = sum / data.length / 255; // 0-1 overall level
      smoothedPulse += (target - smoothedPulse) * EASE;

      const minRadius = canvas.height * PULSE_MIN_RADIUS_RATIO;
      const maxRadius = canvas.height * PULSE_MAX_RADIUS_RATIO;
      const radius = minRadius + smoothedPulse * (maxRadius - minRadius);

      const cx = canvas.width / 2;
      const cy = canvas.height;

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      glow.addColorStop(0, "#ffffff");
      glow.addColorStop(0.45, "#ff8a1e");
      glow.addColorStop(1, "rgba(200, 20, 40, 0)");

      ctx.globalAlpha = OPACITY;
      ctx.fillStyle = glow;
      ctx.beginPath();
      // Canvas clipping naturally cuts off the bottom half of the circle,
      // so this reads as a glow rising from the bottom edge.
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawArea = (analyser: AnalyserNode) => {
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);

      const sliceWidth = canvas.width / (timeData.length - 1);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let i = 0; i < timeData.length; i++) {
        const amplitude = timeData[i] / 128 - 1; // -1..1
        const y = canvas.height / 2 + amplitude * (canvas.height / 2 - WAVE_LINE_WIDTH);
        ctx.lineTo(i * sliceWidth, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();

      ctx.fillStyle = makeGradient(ctx, canvas);
      // A bit more translucent than the line styles since it's a solid
      // silhouette rather than a thin stroke.
      ctx.globalAlpha = OPACITY * 0.65;
      ctx.fill();
    };

    const drawDots = (analyser: AnalyserNode) => {
      const activeBars = computeActiveBars(analyser);
      if (activeBars.length === 0) {
        return;
      }

      const slotWidth = canvas.width / activeBars.length;
      const dotRadius = Math.max(2, Math.min(10, slotWidth * 0.3));

      ctx.fillStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY;

      activeBars.forEach((barHeight, i) => {
        const x = i * slotWidth + slotWidth / 2;
        const y = canvas.height - barHeight;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawLeds = (analyser: AnalyserNode) => {
      const activeBars = computeActiveBars(analyser);
      if (activeBars.length === 0) {
        return;
      }

      const barWidth = Math.max(
        1,
        (canvas.width - (activeBars.length - 1) * BAR_GAP) /
          activeBars.length,
      );
      const step = LED_SEGMENT_HEIGHT + LED_SEGMENT_GAP;

      ctx.fillStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY;

      activeBars.forEach((barHeight, i) => {
        const x = i * (barWidth + BAR_GAP);
        const segmentCount = Math.max(1, Math.floor(barHeight / step));
        for (let s = 0; s < segmentCount; s++) {
          const y = canvas.height - s * step - LED_SEGMENT_HEIGHT;
          ctx.fillRect(x, y, barWidth, LED_SEGMENT_HEIGHT);
        }
      });
    };

    const drawRadial = (analyser: AnalyserNode) => {
      const activeBars = computeActiveBars(analyser);
      if (activeBars.length === 0) {
        return;
      }

      const cx = canvas.width / 2;
      const cy = canvas.height;
      const innerRadius = canvas.height * RADIAL_INNER_RATIO;
      const reach = canvas.height * RADIAL_REACH_RATIO;

      ctx.strokeStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY;
      ctx.lineWidth = Math.max(2, canvas.width / activeBars.length / 3);
      ctx.lineCap = "round";

      // Spread bars across the top half-circle (PI..2PI keeps sin<=0, i.e.
      // above the bottom-anchored center) so it reads as a fan rising from
      // the bottom edge, matching the other bottom-anchored styles.
      const angleStep = Math.PI / activeBars.length;
      activeBars.forEach((barHeight, i) => {
        const angle = Math.PI + i * angleStep;
        const outer = innerRadius + (barHeight / canvas.height) * reach;
        const x1 = cx + Math.cos(angle) * innerRadius;
        const y1 = cy + Math.sin(angle) * innerRadius;
        const x2 = cx + Math.cos(angle) * outer;
        const y2 = cy + Math.sin(angle) * outer;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    };

    const drawRings = (analyser: AnalyserNode, now: number) => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      // Averaging across all ~1024 bins washes the signal out - most of
      // them are near-silent high frequencies (same reason bars need the
      // log-scale mapping). Beats/transients live in the bass range, so
      // read the level from just the low ~12% of bins instead.
      const bassRangeCount = Math.max(1, Math.floor(data.length * 0.12));
      let sum = 0;
      for (let i = 0; i < bassRangeCount; i++) {
        sum += data[i];
      }
      const level = sum / bassRangeCount / 255;
      ringEnergyAvg += (level - ringEnergyAvg) * 0.05;

      // A simple transient/beat heuristic: spawn a ring when the level
      // spikes well above its own rolling average, debounced so loud
      // sustained audio doesn't spawn a new ring every single frame.
      if (
        level > ringEnergyAvg * 1.25 &&
        level > 0.1 &&
        now - lastRingSpawn > RING_SPAWN_MIN_INTERVAL
      ) {
        rings.push({ radius: canvas.height * 0.08, alpha: 0.9 });
        lastRingSpawn = now;
      }

      const cx = canvas.width / 2;
      const cy = canvas.height;
      rings = rings.filter((ring) => ring.alpha > 0.02);
      rings.forEach((ring) => {
        ring.radius += canvas.height * RING_GROWTH_RATIO;
        ring.alpha *= RING_FADE;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 138, 30, ${ring.alpha * OPACITY})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    };

    const spectrogramColor = (value: number) => {
      const t = value / 255;
      const r = Math.round(60 + t * 195);
      const g = Math.round(t * 170);
      const b = Math.round(t * 110);
      return `rgba(${r}, ${g}, ${b}, ${OPACITY})`;
    };

    // Scrolls the previous frame's pixels left and paints a new column on
    // the right, colored per-row by frequency intensity (bottom = bass,
    // top = treble via the same log-scale mapping the bars use) - a
    // rolling history of the spectrum instead of an instantaneous snapshot.
    const drawSpectrogram = (analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      ctx.globalAlpha = 1;
      ctx.drawImage(
        canvas,
        SPECTROGRAM_SCROLL_PX,
        0,
        canvas.width - SPECTROGRAM_SCROLL_PX,
        canvas.height,
        0,
        0,
        canvas.width - SPECTROGRAM_SCROLL_PX,
        canvas.height,
      );

      const maxBinIndex = data.length - 1;
      const logMax = Math.log2(maxBinIndex + 1);
      const rows = Math.max(1, Math.round(canvas.height / SPECTROGRAM_ROW_HEIGHT));
      const rowHeight = canvas.height / rows;
      const colX = canvas.width - SPECTROGRAM_SCROLL_PX;

      for (let r = 0; r < rows; r++) {
        const scale = (r / rows) * logMax;
        const binIndex = Math.min(maxBinIndex, Math.round(2 ** scale - 1));
        const y = canvas.height - (r + 1) * rowHeight;
        ctx.fillStyle = spectrogramColor(data[binIndex]);
        ctx.fillRect(colX, y, SPECTROGRAM_SCROLL_PX, rowHeight + 1);
      }
    };

    const drawFireflies = (analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const bassRangeCount = Math.max(1, Math.floor(data.length * 0.2));
      let sum = 0;
      for (let i = 0; i < bassRangeCount; i++) {
        sum += data[i];
      }
      const level = sum / bassRangeCount / 255;

      if (level > 0.12) {
        const spawnCount = Math.round(level * 4);
        for (let i = 0; i < spawnCount; i++) {
          fireflies.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -(0.6 + Math.random() * 1.2),
            size: 2 + Math.random() * 3,
            life: 1,
          });
        }
      }
      if (fireflies.length > FIREFLY_CAP) {
        fireflies.splice(0, fireflies.length - FIREFLY_CAP);
      }

      fireflies = fireflies.filter((p) => p.life > 0.03 && p.y > -10);
      ctx.globalAlpha = OPACITY;
      fireflies.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life *= 0.985;

        const glowRadius = p.size * 3;
        const glow = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius,
        );
        glow.addColorStop(0, `rgba(255, 255, 255, ${p.life})`);
        glow.addColorStop(0.5, `rgba(255, 138, 30, ${p.life * 0.6})`);
        glow.addColorStop(1, "rgba(200, 20, 40, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawBlob = (analyser: AnalyserNode) => {
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);

      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < BLOB_POINTS; i++) {
        const dataIndex = Math.floor(
          (i / (BLOB_POINTS - 1)) * (timeData.length - 1),
        );
        const amplitude = timeData[dataIndex] / 128 - 1;
        points.push({
          x: (i / (BLOB_POINTS - 1)) * canvas.width,
          y: canvas.height / 2 + amplitude * (canvas.height / 2 - WAVE_LINE_WIDTH),
        });
      }

      // Quadratic-curve through midpoints for a smooth, organic silhouette
      // instead of Area's straight line segments.
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();

      ctx.fillStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY * 0.65;
      ctx.fill();

      ctx.strokeStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY;
      ctx.lineWidth = WAVE_LINE_WIDTH;
      ctx.stroke();
    };

    const drawStarburst = (analyser: AnalyserNode) => {
      const activeBars = computeActiveBars(analyser);
      if (activeBars.length === 0) {
        return;
      }

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const innerRadius = Math.min(canvas.width, canvas.height) * STARBURST_INNER_RATIO;

      ctx.strokeStyle = makeGradient(ctx, canvas);
      ctx.globalAlpha = OPACITY;
      ctx.lineWidth = Math.max(2, canvas.width / activeBars.length / 4);
      ctx.lineCap = "round";

      // Full circle (not the bottom-anchored half used by "radial") -
      // spikes radiate outward from the center in every direction.
      const angleStep = (Math.PI * 2) / activeBars.length;
      activeBars.forEach((barHeight, i) => {
        const angle = i * angleStep;
        const outer = innerRadius + barHeight * 0.5;
        const x1 = cx + Math.cos(angle) * innerRadius;
        const y1 = cy + Math.sin(angle) * innerRadius;
        const x2 = cx + Math.cos(angle) * outer;
        const y2 = cy + Math.sin(angle) * outer;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    };

    const drawVu = (analyser: AnalyserNode) => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const bassRangeCount = Math.max(1, Math.floor(data.length * 0.3));
      let sum = 0;
      for (let i = 0; i < bassRangeCount; i++) {
        sum += data[i];
      }
      const target = sum / bassRangeCount / 255;
      smoothedVu += (target - smoothedVu) * EASE;

      const cx = canvas.width / 2;
      const cy = canvas.height * 0.92;
      const radius = Math.min(canvas.width * 0.35, canvas.height * VU_RADIUS_RATIO);

      // Gauge track.
      ctx.globalAlpha = OPACITY * 0.5;
      ctx.strokeStyle = makeGradient(ctx, canvas);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Needle sweeps from PI (left) to 2*PI (right) with the eased level.
      const angle = Math.PI + smoothedVu * Math.PI;
      const needleLength = radius * 0.9;
      const nx = cx + Math.cos(angle) * needleLength;
      const ny = cy + Math.sin(angle) * needleLength;

      ctx.globalAlpha = OPACITY;
      ctx.strokeStyle = makeGradient(ctx, canvas);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      ctx.fillStyle = "#ff8a1e";
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      const analyser = getAnalyser();
      if (!analyser) {
        return;
      }

      const style = styleRef.current;
      // "spectrogram" scrolls the previous frame's pixels rather than
      // redrawing from scratch, so skip clearing every frame for it - only
      // clear once, on the frame a style change lands on it.
      if (style !== "spectrogram" || style !== lastStyle) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      lastStyle = style;

      if (style === "wave") {
        drawWave(analyser);
      } else if (style === "pulse") {
        drawPulse(analyser);
      } else if (style === "area") {
        drawArea(analyser);
      } else if (style === "dots") {
        drawDots(analyser);
      } else if (style === "leds") {
        drawLeds(analyser);
      } else if (style === "radial") {
        drawRadial(analyser);
      } else if (style === "rings") {
        drawRings(analyser, performance.now());
      } else if (style === "spectrogram") {
        drawSpectrogram(analyser);
      } else if (style === "fireflies") {
        drawFireflies(analyser);
      } else if (style === "blob") {
        drawBlob(analyser);
      } else if (style === "starburst") {
        drawStarburst(analyser);
      } else if (style === "vu") {
        drawVu(analyser);
      } else {
        drawBars(analyser, style === "mirror");
      }
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
