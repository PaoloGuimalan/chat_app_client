/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

/**
 * Playback for one remote audio consumer. Rendered off-stage (the tiles carry
 * video only), one element per consumer so each track keeps its own sink.
 */
function RemoteAudio({ consumer }: { consumer: any }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !consumer) {
      return;
    }

    consumer.resume?.();
    audio.autoplay = true;
    audio.muted = false;

    const handleTrack = (track: MediaStreamTrack) => {
      audio.srcObject = new MediaStream([track]);
      audio.play().catch((err) => console.log("Autoplay failed:", err));
    };

    consumer.on?.("track", handleTrack);
    if (consumer.track) {
      handleTrack(consumer.track);
    }

    return () => {
      consumer.off?.("track", handleTrack);
      if (audio.srcObject) {
        audio.srcObject = null;
      }
    };
  }, [consumer]);

  return <audio ref={audioRef} />;
}

export default RemoteAudio;
