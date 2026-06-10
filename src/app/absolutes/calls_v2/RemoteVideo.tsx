/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";

const RemoteVideo = ({
  consumer,
  cameraOff = false,
  muted = false,
  label = "Participant",
  source,
}: {
  consumer: any;
  cameraOff?: boolean;
  muted?: boolean;
  label?: string;
  source?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isAudioConsumer = consumer?.kind === "audio";

  const shouldHideVideo = cameraOff && !isAudioConsumer && source !== "screen";

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  useEffect(() => {
    if (!consumer) return;
    if (shouldHideVideo) return;

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
  }, [consumer, isAudioConsumer, shouldHideVideo]);

  if (isAudioConsumer) {
    return <audio ref={audioRef} />;
  }

  if (shouldHideVideo) {
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
    <div
      className={
        source !== "screen"
          ? "div_video_blocks"
          : isMobileView
            ? "div_video_blocks"
            : "div_video_screen_blocks"
      }
    >
      <video ref={videoRef} className="video_call_display" />
    </div>
  );
};

export default RemoteVideo;
