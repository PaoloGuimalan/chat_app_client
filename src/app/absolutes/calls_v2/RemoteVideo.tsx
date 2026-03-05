/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

const RemoteVideo = ({
  consumer,
  cameraOff = false,
  muted = false,
  label = "Participant",
}: {
  consumer: any;
  cameraOff?: boolean;
  muted?: boolean;
  label?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isAudioConsumer = consumer?.kind === "audio";

  useEffect(() => {
    if (!consumer) return;
    if (cameraOff && !isAudioConsumer) return;

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
  }, [consumer, isAudioConsumer, cameraOff]);

  if (isAudioConsumer) {
    return <audio ref={audioRef} />;
  }

  if (cameraOff) {
    return (
      <div className="div_video_blocks">
        <div className="video_call_display tw-rounded-[5px] tw-flex tw-items-center tw-justify-center tw-bg-[#1f1f1f] tw-text-[12px] tw-font-semibold tw-text-white">
          {label}
          {" • camera off"}
          {muted ? " • muted" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="div_video_blocks">
      <video ref={videoRef} className="video_call_display" />
    </div>
  );
};

export default RemoteVideo;

