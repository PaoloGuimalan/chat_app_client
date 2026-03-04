/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

const RemoteVideo = ({ consumer }: { consumer: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isAudioConsumer = consumer?.kind === "audio";

  useEffect(() => {
    if (!consumer) return;

    const mediaElement = isAudioConsumer ? audioRef.current : videoRef.current;
    if (!mediaElement) return;

    consumer.resume();

    mediaElement.autoplay = true;
    mediaElement.muted = false;
    // mediaElement.playsInline = true;

    const handleTrack = (track: MediaStreamTrack) => {
      const stream = new MediaStream([track]);
      mediaElement.srcObject = stream;
      mediaElement
        .play()
        .catch((e) => console.log("Autoplay failed:", track.kind, e));
    };

    consumer.on("track", handleTrack);

    if (consumer.track) {
      handleTrack(consumer.track);
    }

    return () => {
      consumer.off("track", handleTrack);
      if (mediaElement.srcObject) {
        mediaElement.srcObject = null;
      }
    };
  }, [consumer, isAudioConsumer]);

  if (isAudioConsumer) {
    return <audio ref={audioRef} />;
  }

  return (
    <div className="div_video_blocks">
      <video ref={videoRef} className="video_call_display" />
    </div>
  );
};

export default RemoteVideo;

