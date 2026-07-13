import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { IoPause, IoPlay } from "react-icons/io5";

interface VoiceMessagePlayerProp {
  src: string;
  isSender: boolean;
  accentColor: string;
  onReady?: () => void;
}

const BAR_COUNT = 40;
const MIN_BAR_HEIGHT = 0.12;
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

    if (duration > MAX_WAVEFORM_DECODE_SECONDS) {
      setBars(fallbackBars(src, BAR_COUNT));
      return;
    }

    let cancelled = false;
    decodeWaveform(src, BAR_COUNT)
      .then((peaks) => {
        if (!cancelled) setBars(peaks);
      })
      .catch(() => {
        if (!cancelled) setBars(fallbackBars(src, BAR_COUNT));
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
          {bars.map((amplitude, index) => {
            const barPosition = (index / bars.length) * 100;
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
