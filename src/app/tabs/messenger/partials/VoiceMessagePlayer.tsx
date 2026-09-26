import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useInView } from "framer-motion";
import { IoPause, IoPlay } from "react-icons/io5";

interface VoiceMessagePlayerProp {
  src: string;
  isSender: boolean;
  accentColor: string;
  onReady?: () => void;
  // Merged onto the root's inline style, after the sender/receiver
  // background+border - lets a caller override something like `.cl-voice-
  // message`'s shadow (e.g. the quote in ReplyingToPreview, which should not
  // carry the same lift as the actual message) without a dedicated boolean
  // prop for every one-off variant.
  style?: CSSProperties;
}

const BAR_COUNT = 40;
const MIN_BAR_HEIGHT = 0.12;
// Must match `.cl-voice-message__bar`'s width and the waveform's gap in
// styles.css - together they make the waveform's full width (198px).
const BAR_WIDTH = 3;
const BAR_GAP = 2;
// Fewer than this stops reading as a waveform; below it the strip clips.
const MIN_VISIBLE_BARS = 8;

// How many bars fit a waveform `width` px wide.
const barsThatFit = (width: number) =>
  Math.max(
    MIN_VISIBLE_BARS,
    Math.min(BAR_COUNT, Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP))),
  );

// The waveform squeezed to `count` bars, each the loudest of the bars it
// stands for - so a peak survives the squeeze instead of averaging away.
const resampleBars = (bars: number[], count: number) => {
  if (count >= bars.length) return bars;
  return Array.from({ length: count }, (_, i) => {
    const start = Math.floor((i * bars.length) / count);
    const end = Math.floor(((i + 1) * bars.length) / count);
    return Math.max(...bars.slice(start, Math.max(end, start + 1)));
  });
};
// Beyond this, skip downloading/decoding the full file for a real waveform
// (an hours-long recording can decode to hundreds of MB of raw PCM) and use
// the generated fallback shape instead - still fixed-width, just not a true
// amplitude reading.
const MAX_WAVEFORM_DECODE_SECONDS = 600;

const formatDuration = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Deterministic pseudo-random bars, used as a fallback when the audio can't
// be fetched/decoded (e.g. the storage host doesn't send CORS headers) so
// the waveform still looks intentional rather than a flat line.
const fallbackBars = (seed: string, count: number) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(MIN_BAR_HEIGHT + ((h % 1000) / 1000) * (1 - MIN_BAR_HEIGHT));
  }
  return bars;
};

// Keyed by `src`, so the SAME clip always draws the SAME waveform everywhere
// it appears - most visibly, a voice message and the quoted copy of it above
// a reply (ReplyingToPreview mounts its own VoiceMessagePlayer instance).
// Without this, each instance decoded independently: two concurrent fetches
// of the same file, and whichever one lost a CORS/network race fell back to
// the seeded-random shape while the other showed the real amplitude reading -
// same audio, two different-looking waveforms. The in-flight map dedupes the
// fetch itself, not just the result, so two instances mounting at once still
// only download the file once.
const waveformCache = new Map<string, number[]>();
const waveformInFlight = new Map<string, Promise<number[]>>();

const resolveWaveform = (src: string, count: number, duration: number) => {
  const cached = waveformCache.get(src);
  if (cached) return Promise.resolve(cached);

  let promise = waveformInFlight.get(src);
  if (!promise) {
    promise =
      duration > MAX_WAVEFORM_DECODE_SECONDS
        ? Promise.resolve(fallbackBars(src, count))
        : decodeWaveform(src, count).catch(() => fallbackBars(src, count));
    promise.then((bars) => {
      waveformCache.set(src, bars);
      waveformInFlight.delete(src);
    });
    waveformInFlight.set(src, promise);
  }
  return promise;
};

const decodeWaveform = async (src: string, count: number) => {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio API unsupported");

  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / count));
    const peaks: number[] = [];

    for (let i = 0; i < count; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const value = Math.abs(channelData[start + j] || 0);
        if (value > max) max = value;
      }
      peaks.push(max);
    }

    const normalizedMax = Math.max(...peaks, 0.01);
    return peaks.map((p) =>
      Math.max(MIN_BAR_HEIGHT, p / normalizedMax),
    );
  } finally {
    audioCtx.close();
  }
};

function VoiceMessagePlayer({
  src,
  isSender,
  accentColor,
  onReady,
  style,
}: VoiceMessagePlayerProp) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const hasStartedDecodeRef = useRef(false);
  const isInView = useInView(waveformRef, { amount: "some" });

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars, setBars] = useState<number[]>(() =>
    Array(BAR_COUNT).fill(MIN_BAR_HEIGHT),
  );
  // How many of the bars the waveform has room for. It used to draw all 40
  // at a fixed 3px whatever its width, so in a narrow bubble (the minimized
  // conversation window) they spilled out over the time and past the bubble.
  const [fitCount, setFitCount] = useState(BAR_COUNT);

  useEffect(() => {
    const waveform = waveformRef.current;
    if (!waveform) return;
    const measure = () => setFitCount(barsThatFit(waveform.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(waveform);
    return () => observer.disconnect();
  }, []);

  const shownBars = useMemo(
    () => resampleBars(bars, fitCount),
    [bars, fitCount],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      onReady?.();
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    // Wait for the cheap metadata-only duration read (preload="metadata")
    // before deciding whether it's safe to fully fetch+decode the file.
    if (!isInView || hasStartedDecodeRef.current || duration <= 0) return;
    hasStartedDecodeRef.current = true;

    let cancelled = false;
    resolveWaveform(src, BAR_COUNT, duration).then((bars) => {
      if (!cancelled) setBars(bars);
    });

    return () => {
      cancelled = true;
    };
  }, [isInView, duration, src]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const seekFromClientX = (clientX: number) => {
    const container = waveformRef.current;
    const audio = audioRef.current;
    if (!container || !audio || !duration) return;

    const rect = container.getBoundingClientRect();
    const fraction = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width),
    );
    const time = fraction * duration;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    seekFromClientX(e.clientX);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const textColor = isSender ? "white" : "var(--text)";
  const trackColor = isSender ? "rgba(255,255,255,0.35)" : "var(--border-2)";

  return (
    <div
      className="cl-voice-message"
      style={{
        backgroundColor: isSender ? accentColor : "var(--surface)",
        border: isSender
          ? `solid 1px ${accentColor}`
          : "solid 1px var(--border)",
        ...style,
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={togglePlayback}
        className="cl-voice-message__toggle"
        style={{
          backgroundColor: isSender ? "rgba(255,255,255,0.22)" : accentColor,
          color: "white",
        }}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? <IoPause /> : <IoPlay style={{ marginLeft: 2 }} />}
      </button>
      <div className="cl-voice-message__body">
        <div
          ref={waveformRef}
          className="cl-voice-message__waveform"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {shownBars.map((amplitude, index) => {
            const barPosition = (index / shownBars.length) * 100;
            const isPlayed = barPosition <= progressPercent;
            return (
              <span
                key={index}
                className="cl-voice-message__bar"
                style={{
                  height: `${Math.round(amplitude * 100)}%`,
                  backgroundColor: isPlayed ? textColor : trackColor,
                }}
              />
            );
          })}
        </div>
        <span className="cl-voice-message__time" style={{ color: textColor }}>
          {formatDuration(currentTime > 0 ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
}

export default VoiceMessagePlayer;
