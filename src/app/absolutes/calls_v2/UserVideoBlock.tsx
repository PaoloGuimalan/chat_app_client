/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import "../../../styles/styles.css";

function UserVideoBlock({ mediaStream }: { mediaStream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef) {
      if (videoRef.current) {
        if (mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.addEventListener("loadedmetadata", () => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play();
            }
          });
        }
      }
    }
  }, [videoRef, mediaStream]);

  return (
    <div className="div_video_blocks">
      {mediaStream && <video className="video_call_display" ref={videoRef} />}
    </div>
  );
}

export default UserVideoBlock;
