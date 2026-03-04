/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

const RemoteVideo = ({
  consumer,
  //   producerId,
}: {
  consumer: any;
  //   producerId: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkRTP = async () => {
      try {
        const stats = await consumer.getStats();

        // Convert to array if needed
        const statsArray = Array.isArray(stats) ? stats : Object.values(stats);

        // Find RTP stats
        const rtpStats =
          statsArray.find((stat) => stat.type === "inbound-rtp") ||
          statsArray[0]; // Fallback

        console.table({
          packetsReceived: rtpStats?.packetsReceived || 0,
          packetsLost: rtpStats?.packetsLost || 0,
          bytesReceived: rtpStats?.bytesReceived || 0,
          jitter: rtpStats?.jitter || 0,
        });
      } catch (e) {
        console.log("Stats error:", e);
      }
    };

    checkRTP();
    const interval = setInterval(checkRTP, 2000);
    return () => clearInterval(interval);
  }, [consumer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !consumer) return;

    consumer.resume();

    // Video element setup
    video.autoplay = true;
    video.muted = false; // ← Video NOT muted
    video.playsInline = true;
    video.controls = false; // Debug

    const handleTrack = (track: MediaStreamTrack) => {
      console.log("🎥 Track:", track.kind, "enabled:", track.enabled);

      // Track already perfect (live + enabled)
      const stream = new MediaStream([track]);
      video.srcObject = stream;

      setTimeout(() => {
        const video = videoRef.current;
        console.log("📏 VIDEO SIZE:", {
          videoWidth: video?.videoWidth,
          videoHeight: video?.videoHeight,
          readyState: video?.readyState,
        });
      }, 1000);

      // Force play
      video.play().catch((e) => console.log("Autoplay failed:", e));
    };

    consumer.on("track", handleTrack);

    // Check existing track
    if (consumer.track) {
      handleTrack(consumer.track);
    }

    return () => {
      consumer.off("track", handleTrack);
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, [consumer]);

  return (
    <div className="div_video_blocks">
      <video ref={videoRef} className="video_call_display" />
    </div>
  );
};

export default RemoteVideo;
