/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import "../../../styles/styles.css";

function UserVideoBlock({
  mediaStream,
  cameraOff = false,
  muted = false,
}: {
  mediaStream: MediaStream;
  cameraOff?: boolean;
  muted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaStream || cameraOff) {
      return;
    }

    video.srcObject = mediaStream;
    video.muted = true;

    const playPreview = () => {
      video.play().catch((err) => {
        console.log("Local preview play failed:", err);
      });
    };

    if (video.readyState >= 1) {
      playPreview();
    } else {
      video.onloadedmetadata = playPreview;
    }

    return () => {
      video.onloadedmetadata = null;
    };
  }, [mediaStream, cameraOff]);

  if (cameraOff) {
    return (
      <div className="div_video_blocks">
        <div className="video_call_display tw-rounded-[5px] tw-flex tw-items-center tw-justify-center tw-bg-[#1f1f1f] tw-text-[12px] tw-font-semibold tw-text-white">
          You - camera off
          {muted ? " - muted" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="div_video_blocks">
      {mediaStream && (
        <video
          className="video_call_display"
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
      )}
    </div>
  );
}

export default UserVideoBlock;
