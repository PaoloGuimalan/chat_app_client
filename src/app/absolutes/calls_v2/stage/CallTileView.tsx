/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { BsCameraVideoOffFill, BsFillMicMuteFill } from "react-icons/bs";
import { MdScreenShare } from "react-icons/md";
import { RxEnterFullScreen } from "react-icons/rx";
import { TbPin, TbPinFilled } from "react-icons/tb";
import { CallTileData } from "./types";

/**
 * Binds a tile's media to its own <video>.
 *
 * Remote tiles bind THIS consumer's track specifically — a peer's camera and
 * screen-share arrive as two consumers, so binding per-track is what keeps the
 * two tiles distinct. Every video element is muted: audio is played by the
 * separate audio consumers, and a muted element is never blocked by the
 * browser's autoplay policy.
 */
function TileMedia({
  tile,
  objectFit,
}: {
  tile: CallTileData;
  objectFit: "cover" | "contain";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = true;

    const play = () => {
      video.play().catch(() => {
        // Autoplay can still be refused while the tab is backgrounded —
        // the element resumes on its own once it is visible again.
      });
    };

    if (tile.consumer) {
      const consumer = tile.consumer;
      consumer.resume?.();

      const handleTrack = (track: MediaStreamTrack) => {
        video.srcObject = new MediaStream([track]);
        play();
      };

      consumer.on?.("track", handleTrack);
      if (consumer.track) {
        handleTrack(consumer.track);
      }

      return () => {
        consumer.off?.("track", handleTrack);
        if (video.srcObject) {
          video.srcObject = null;
        }
      };
    }

    if (tile.stream) {
      video.srcObject = tile.stream;
      play();
    }

    return () => {
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, [tile.consumer, tile.stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="cl-calltile-video"
      style={{
        objectFit,
        transform: tile.mirror ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

/**
 * Tile chrome: rounded card, the video (or an avatar placeholder when there is
 * no track), a bottom-left label chip carrying the mute / camera-off state,
 * and — on the tiles worth enlarging — pin and fullscreen actions.
 */
function CallTileView({
  tile,
  variant = "stage",
  isFocused = false,
  canFocus = true,
  onToggleFocus,
}: {
  tile: CallTileData;
  variant?: "stage" | "thumb";
  isFocused?: boolean;
  canFocus?: boolean;
  onToggleFocus?: (key: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const isThumb = variant === "thumb";
  // Shared screens are usually a desktop aspect ratio — `contain` so nothing
  // is cropped. Cameras fill their tile with `cover`.
  const objectFit = tile.isScreen ? "contain" : "cover";
  const initial = (tile.label.replace(/^@/, "").trim().charAt(0) || "?")
    .toUpperCase();

  const requestFullscreen = () => {
    const node = frameRef.current;
    if (!node) {
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    node.requestFullscreen?.().catch(() => {
      // Fullscreen can be refused (permissions policy in an iframe) — the
      // pin action is still available as the in-page equivalent.
    });
  };

  return (
    <div
      ref={frameRef}
      className={`cl-calltile${isFocused ? " is-focused" : ""}${
        isThumb ? " is-thumb" : ""
      }`}
      onDoubleClick={
        canFocus && onToggleFocus ? () => onToggleFocus(tile.key) : undefined
      }
    >
      {tile.hasVideo ? (
        <TileMedia tile={tile} objectFit={objectFit} />
      ) : (
        <div className="cl-calltile-avatar-wrap">
          <div className="cl-calltile-avatar cl-text-section">{initial}</div>
        </div>
      )}

      <div className="cl-calltile-label">
        {tile.isScreen && <MdScreenShare className="cl-calltile-label-icon" />}
        <span className="cl-calltile-name cl-text-meta">{tile.label}</span>
        {tile.muted && <BsFillMicMuteFill className="cl-calltile-label-icon" />}
        {tile.cameraOff && !tile.isScreen && (
          <BsCameraVideoOffFill className="cl-calltile-label-icon" />
        )}
      </div>

      {(canFocus || tile.isScreen) && (
        <div className="cl-calltile-actions">
          {canFocus && onToggleFocus && (
            <button
              type="button"
              aria-label={isFocused ? "Unpin tile" : "Pin tile"}
              title={isFocused ? "Unpin" : "Pin to stage"}
              className="cl-calltile-action"
              onClick={(event) => {
                event.stopPropagation();
                onToggleFocus(tile.key);
              }}
            >
              {isFocused ? <TbPinFilled /> : <TbPin />}
            </button>
          )}
          {tile.isScreen && !isThumb && (
            <button
              type="button"
              aria-label="Fullscreen"
              title="Fullscreen"
              className="cl-calltile-action"
              onClick={(event) => {
                event.stopPropagation();
                requestFullscreen();
              }}
            >
              <RxEnterFullScreen />
            </button>
          )}
        </div>
      )}

    </div>
  );
}

export default CallTileView;
