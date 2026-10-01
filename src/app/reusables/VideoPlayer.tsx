import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose, AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  IoContract,
  IoExpand,
  IoPlay,
  IoReload,
  IoVideocamOffOutline,
  IoVolumeHigh,
  IoVolumeMute,
} from "react-icons/io5";
import { useScopedPortalRoot } from "@/reusables/hooks/useScopedPortalRoot";
import {
  applyPlayback,
  claimPlayback,
  pauseDuplicates,
  readPlayback,
  registerPlayback,
  startPlayback,
  type PlaybackClaim,
  type PlaybackEntry,
  type PlaybackState,
} from "./videoPlayback";

/**
 * The webapp's one video player - every post, chat and attachment video.
 *
 * Content first, almost no chrome: a thin progress line along the bottom edge
 * (thicker, with a handle, under the pointer), a time chip bottom-left
 * (the length, then the time left once it plays), expand and mute chips
 * bottom-right, and a play badge in the middle whenever it is paused. A click
 * anywhere else plays or pauses; a double-click or the expand chip opens the
 * app's own full-screen viewer, never the browser's.
 *
 * Small boxes shed chips rather than squeezing them (see sizeOf) - a reply
 * quote can be 56px wide.
 *
 * Callers size it one of two ways: the box (className/style) when the slot
 * decides, or the video (videoClassName/videoStyle) when the media's own shape
 * does - the box shrink-wraps the video either way. The box clips, so a
 * rounded corner belongs on the box.
 */

type Size = "xs" | "sm" | "md" | "lg";
type Zone = "hidden" | "partly" | "watching";

const SEEK_STEP_SECONDS = 5;
/** A stall shorter than this never shows a spinner - seeks blink otherwise. */
const WAITING_DELAY_MS = 250;
/** Until the video says otherwise - the common landscape shape. */
const DEFAULT_RATIO = 16 / 9;

const formatClock = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
    : `${minutes}:${secs}`;
};

/**
 * Which chips the box has room for: `xs` keeps only the badge and the line,
 * `sm` adds mute, `md`/`lg` everything (`md` with a smaller badge). Width
 * decides whether the chips fit side by side; height whether the badge clears
 * them - a landscape chat bubble on a phone is 240x135 and keeps them all.
 */
const sizeOf = (width: number, height: number): Size => {
  if (width < 90 || height < 64) return "xs";
  if (width < 130 || height < 110) return "sm";
  if (width < 260 || height < 160) return "md";
  return "lg";
};

/** The time chip shares the bottom row with two 30px chips. */
const MIN_WIDTH_FOR_TIME = 150;

/** Space/K, ←/→ and M - shared by the inline player and the viewer. */
const handleMediaKey = (key: string, video: HTMLVideoElement) => {
  switch (key) {
    case " ":
    case "k":
    case "K":
      if (video.paused || video.ended) startPlayback(video, false);
      else video.pause();
      return true;
    case "ArrowLeft":
      video.currentTime = Math.max(0, video.currentTime - SEEK_STEP_SECONDS);
      return true;
    case "ArrowRight":
      if (isFinite(video.duration)) {
        video.currentTime = Math.min(
          video.duration,
          video.currentTime + SEEK_STEP_SECONDS,
        );
      }
      return true;
    case "m":
    case "M":
      video.muted = !video.muted;
      return true;
    default:
      return false;
  }
};

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

interface ViewerBinding {
  /** Where the inline player was when it opened the viewer. */
  initial: PlaybackState;
  onExit: () => void;
}

export interface VideoPlayerProps {
  src: string;
  /** The box the controls sit on. */
  className?: string;
  style?: CSSProperties;
  /** The <video> itself. */
  videoClassName?: string;
  videoStyle?: CSSProperties;
  /**
   * Plays by itself, with sound, on the way into view (half of it showing),
   * and pauses once none of it is - a feed post's lone video, as on mobile.
   */
  autoPlayInView?: boolean;
  /** Pauses once none of it is in view (a carousel slide swiped away). */
  pauseWhenHidden?: boolean;
  /**
   * On coming into view, carries on from wherever the same video already
   * was, and hands it back on unmount - the post modal opened over a feed
   * video that was playing. Pauses when hidden, too.
   */
  continuePlayback?: boolean;
  /** Starts with the sound off - a post shown inside a Moment. */
  startMuted?: boolean;
  onLoadedMetadata?: (event: SyntheticEvent<HTMLVideoElement>) => void;
  /** Internal: makes this the full-screen viewer's own player. */
  viewer?: ViewerBinding;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer(
    {
      src,
      className = "",
      style,
      videoClassName = "",
      videoStyle,
      autoPlayInView = false,
      pauseWhenHidden = false,
      continuePlayback = false,
      startMuted = false,
      onLoadedMetadata,
      viewer,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement, []);

    const [playing, setPlaying] = useState(false);
    const [started, setStarted] = useState(false);
    const [ended, setEnded] = useState(false);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    /** Whole seconds played - what the time chip counts down from. */
    const [second, setSecond] = useState(0);
    const [waiting, setWaiting] = useState(false);
    const [failed, setFailed] = useState(false);
    const [scrubbing, setScrubbing] = useState(false);
    const [size, setSize] = useState<Size>("md");
    const [roomForTime, setRoomForTime] = useState(true);
    const [viewerOpen, setViewerOpen] = useState<{
      state: PlaybackState;
      ratio: number;
    } | null>(null);

    /** Watched by an IntersectionObserver - see the effect below. */
    const managed =
      !viewer && (autoPlayInView || pauseWhenHidden || continuePlayback);
    const managedRef = useRef(managed);
    managedRef.current = managed;

    const zoneRef = useRef<Zone | null>(null);
    /** Another player has this video for now: the viewer, the post modal. */
    const suspendedRef = useRef(false);
    const claimRef = useRef<PlaybackClaim | null>(null);
    const draggingRef = useRef(false);
    const waitingTimerRef = useRef<number | undefined>(undefined);

    const entryRef = useRef<PlaybackEntry | null>(null);
    if (!entryRef.current) {
      entryRef.current = {
        src,
        video: () => videoRef.current,
        suspend: () => {
          suspendedRef.current = true;
          videoRef.current?.pause();
        },
        resume: (state) => {
          suspendedRef.current = false;
          const video = videoRef.current;
          if (!video) return;
          // Scrolled away meanwhile: back paused, as a hidden one would be.
          const hidden = managedRef.current && zoneRef.current === "hidden";
          applyPlayback(video, hidden ? { ...state, playing: false } : state);
        },
        lastActive: 0,
      };
    }
    const entry = entryRef.current;

    useEffect(() => {
      entry.src = src;
    }, [entry, src]);

    useEffect(() => registerPlayback(entry), [entry]);

    // Progress and buffered go straight onto the box as CSS variables: they
    // move every frame while playing, and a React render per frame is waste.
    const paint = useCallback(() => {
      const video = videoRef.current;
      const root = rootRef.current;
      if (!video || !root) return;
      const total = video.duration;
      const known = isFinite(total) && total > 0;
      const time = video.currentTime;
      let bufferedEnd = 0;
      const ranges = video.buffered;
      for (let i = 0; i < ranges.length; i++) {
        if (ranges.start(i) <= time + 0.5 && ranges.end(i) >= time) {
          bufferedEnd = ranges.end(i);
        }
      }
      root.style.setProperty(
        "--cl-video-progress",
        known ? Math.min(1, time / total).toFixed(4) : "0",
      );
      root.style.setProperty(
        "--cl-video-buffered",
        known ? Math.min(1, bufferedEnd / total).toFixed(4) : "0",
      );
      setSecond(Math.floor(time));
    }, []);

    // timeupdate only fires about four times a second - a visibly stepping
    // line - so a playing video repaints every frame instead.
    useEffect(() => {
      if (!playing) return;
      let frame = requestAnimationFrame(function tick() {
        paint();
        frame = requestAnimationFrame(tick);
      });
      return () => cancelAnimationFrame(frame);
    }, [playing, paint]);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      const measure = () => {
        setSize(sizeOf(root.clientWidth, root.clientHeight));
        setRoomForTime(root.clientWidth >= MIN_WIDTH_FOR_TIME);
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(root);
      return () => observer.disconnect();
    }, []);

    // A recycled player (a list re-keyed by index) starts over for a new clip.
    const shownSrcRef = useRef(src);
    useEffect(() => {
      if (shownSrcRef.current === src) return;
      shownSrcRef.current = src;
      setPlaying(false);
      setStarted(false);
      setEnded(false);
      setDuration(0);
      setSecond(0);
      setFailed(false);
    }, [src]);

    // The viewer's player picks up where the inline one was. A property, not
    // the `muted` attribute: React doesn't reliably reflect that one.
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (startMuted) video.muted = true;
      if (viewer) applyPlayback(video, viewer.initial);
      // Once, on mount - `viewer` is a fresh object every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Visibility, the mobile app's rules (SharedVideoControllers._reconcile):
    // more than half in view is watching, none of it is hidden, anything else
    // is left alone. Autoplay happens on the way INTO watching, so a video
    // paused while watching stays paused; hidden pauses. `display: none` (a
    // hidden tab) reads as hidden too.
    useEffect(() => {
      const root = rootRef.current;
      if (!root || !managed) return;
      zoneRef.current = null;
      const observer = new IntersectionObserver(
        ([sighting]) => {
          const video = videoRef.current;
          if (!video || !sighting) return;
          const ratio = sighting.isIntersecting
            ? sighting.intersectionRatio
            : 0;
          // Not quite 0.5: a crossing can report a hair under it.
          const zone: Zone =
            ratio <= 0 ? "hidden" : ratio >= 0.49 ? "watching" : "partly";
          if (zone === zoneRef.current) return;
          zoneRef.current = zone;
          if (suspendedRef.current) return;

          if (zone === "hidden") {
            if (!video.paused) video.pause();
            return;
          }
          // First sight, not mount: a carousel mounts every slide at once,
          // and only the one actually shown should take the video over.
          if (continuePlayback && !claimRef.current) {
            const claim = claimPlayback(entry);
            if (claim) {
              claimRef.current = claim;
              applyPlayback(video, claim.state);
              return;
            }
          }
          if (zone === "watching" && autoPlayInView) {
            startPlayback(video, true);
          }
        },
        { threshold: [0, 0.5] },
      );
      observer.observe(root);
      return () => observer.disconnect();
    }, [managed, autoPlayInView, continuePlayback, entry]);

    // A LAYOUT cleanup: by the time a passive one runs, the browser has
    // already paused the detached <video>, and "playing" would read false.
    useLayoutEffect(() => {
      const video = videoRef.current;
      return () => {
        const claim = claimRef.current;
        claimRef.current = null;
        if (claim && video) claim.handBack(readPlayback(video));
      };
    }, []);

    useEffect(() => () => window.clearTimeout(waitingTimerRef.current), []);

    const clearWaiting = () => {
      window.clearTimeout(waitingTimerRef.current);
      setWaiting(false);
    };

    const toggle = () => {
      const video = videoRef.current;
      if (!video || failed) return;
      entry.lastActive = Date.now();
      if (video.paused || video.ended) startPlayback(video, false);
      else video.pause();
    };

    const openViewer = () => {
      const video = videoRef.current;
      if (!video || viewer || failed) return;
      const state = readPlayback(video);
      suspendedRef.current = true;
      video.pause();
      setViewerOpen({
        state,
        ratio:
          video.videoWidth > 0 && video.videoHeight > 0
            ? video.videoWidth / video.videoHeight
            : DEFAULT_RATIO,
      });
    };

    const closeViewer = (state: PlaybackState) => {
      setViewerOpen(null);
      entry.resume(state);
    };

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      // A focused chip keeps its own Space/Enter; the viewer listens on window.
      if (event.target !== event.currentTarget || viewer) return;
      const video = videoRef.current;
      if (!video) return;
      if (event.key === "f" || event.key === "F") openViewer();
      else if (!handleMediaKey(event.key, video)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const seekTo = (clientX: number) => {
      const video = videoRef.current;
      const track = trackRef.current;
      if (!video || !track || !isFinite(video.duration) || video.duration <= 0)
        return;
      const rect = track.getBoundingClientRect();
      const fraction = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width),
      );
      video.currentTime = fraction * video.duration;
      entry.lastActive = Date.now();
      paint();
    };

    const endScrub = () => {
      draggingRef.current = false;
      setScrubbing(false);
    };

    const onScrubStart = (event: ReactPointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      setScrubbing(true);
      seekTo(event.clientX);
    };

    const knownDuration = isFinite(duration) && duration > 0;
    const totalSeconds = Math.round(duration);
    const showTime =
      knownDuration && roomForTime && (size === "md" || size === "lg");
    const showExpand = size === "md" || size === "lg";
    const showMute = size !== "xs";

    return (
      <>
        <div
          ref={rootRef}
          className={`cl-video cl-video--${size}${
            scrubbing ? " is-scrubbing" : ""
          }${viewer ? " cl-video--viewer" : ""} ${className}`}
          style={style}
          role="group"
          aria-label="Video player"
          tabIndex={0}
          onClick={toggle}
          onDoubleClick={viewer ? undefined : openViewer}
          onKeyDown={onKeyDown}
        >
          <video
            ref={videoRef}
            src={src}
            className={`cl-video__media ${videoClassName}`}
            style={videoStyle}
            playsInline
            preload="metadata"
            onPlay={() => {
              setPlaying(true);
              setStarted(true);
              setEnded(false);
              entry.lastActive = Date.now();
              pauseDuplicates(entry);
            }}
            onPause={() => {
              setPlaying(false);
              clearWaiting();
              paint();
            }}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
              clearWaiting();
              paint();
            }}
            onPlaying={clearWaiting}
            onCanPlay={clearWaiting}
            onSeeked={(event) => {
              setEnded(event.currentTarget.ended);
              clearWaiting();
              paint();
            }}
            onWaiting={() => {
              window.clearTimeout(waitingTimerRef.current);
              waitingTimerRef.current = window.setTimeout(
                () => setWaiting(true),
                WAITING_DELAY_MS,
              );
            }}
            onTimeUpdate={paint}
            onProgress={paint}
            onDurationChange={(event) =>
              setDuration(event.currentTarget.duration)
            }
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration);
              paint();
              onLoadedMetadata?.(event);
            }}
            onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
            onError={() => {
              setFailed(true);
              clearWaiting();
            }}
          />

          {failed ? (
            <div className="cl-video__unavailable" onClick={stopPropagation}>
              <IoVideocamOffOutline size={22} />
              <span>Video unavailable</span>
            </div>
          ) : (
            <>
              {playing && waiting ? (
                <span className="cl-video__badge" aria-hidden="true">
                  <AiOutlineLoading3Quarters className="cl-spin" />
                </span>
              ) : (
                !playing && (
                  <span
                    className={`cl-video__badge${
                      ended ? "" : " cl-video__badge--play"
                    }`}
                    aria-hidden="true"
                  >
                    {ended ? <IoReload /> : <IoPlay />}
                  </span>
                )
              )}

              {showTime && (
                <span className="cl-video__chip cl-video__time">
                  {formatClock(
                    started && !ended
                      ? Math.max(0, totalSeconds - second)
                      : totalSeconds,
                  )}
                </span>
              )}

              {(showExpand || showMute) && (
                <div
                  className="cl-video__actions"
                  onDoubleClick={stopPropagation}
                >
                  {showExpand && (
                    <button
                      type="button"
                      className="cl-video__chip cl-video__button"
                      aria-label={viewer ? "Exit full screen" : "Full screen"}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (viewer) viewer.onExit();
                        else openViewer();
                      }}
                    >
                      {viewer ? <IoContract /> : <IoExpand />}
                    </button>
                  )}
                  {showMute && (
                    <button
                      type="button"
                      className="cl-video__chip cl-video__button"
                      aria-label={muted ? "Unmute" : "Mute"}
                      onClick={(event) => {
                        event.stopPropagation();
                        const video = videoRef.current;
                        if (video) video.muted = !video.muted;
                      }}
                    >
                      {muted ? <IoVolumeMute /> : <IoVolumeHigh />}
                    </button>
                  )}
                </div>
              )}

              {/* No length, nothing to scrub along: a recorded webm can
                  report Infinity until it has been read to the end. */}
              {knownDuration && (
                <div
                  ref={trackRef}
                  className="cl-video__scrub"
                  onPointerDown={onScrubStart}
                  onPointerMove={(event) => {
                    if (draggingRef.current) seekTo(event.clientX);
                  }}
                  onPointerUp={endScrub}
                  onPointerCancel={endScrub}
                  onLostPointerCapture={endScrub}
                  onClick={stopPropagation}
                  onDoubleClick={stopPropagation}
                  // A carousel swipes on touch - not while scrubbing.
                  onTouchStart={stopPropagation}
                  onTouchMove={stopPropagation}
                >
                  <div className="cl-video__bar">
                    <div className="cl-video__buffered" />
                    <div className="cl-video__fill" />
                    <div className="cl-video__knob" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {viewerOpen && (
          <FullscreenVideoViewer
            src={src}
            initial={viewerOpen.state}
            ratio={viewerOpen.ratio}
            onClose={closeViewer}
          />
        )}
      </>
    );
  },
);

/**
 * The app's full-screen viewer for a video - the image lightbox's shell
 * (portaled to the page's scope, dark scrim, close button top-right) around
 * a player of its own. It opens where the inline player was and hands the
 * position and play state back on close, so the video carries on in place.
 *
 * Rendered BESIDE the inline player's box, not in it: React events bubble
 * through portals, and a click in here would otherwise also toggle the
 * player underneath.
 */
function FullscreenVideoViewer({
  src,
  initial,
  ratio,
  onClose,
}: {
  src: string;
  initial: PlaybackState;
  ratio: number;
  onClose: (state: PlaybackState) => void;
}) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const portalRoot = useScopedPortalRoot(anchorRef);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closedRef = useRef(false);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    const video = videoRef.current;
    const state = video ? readPlayback(video) : initial;
    video?.pause();
    onCloseRef.current(state);
  }, [initial]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      const video = videoRef.current;
      if (video && handleMediaKey(event.key, video)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    // Capture on window, ahead of the page's own keys - the Moment viewer's
    // Escape, arrows and space would otherwise act on what is behind this.
    window.addEventListener("keydown", onKey, true);

    // The viewer covers the page, so the page behind it must not scroll.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  return (
    <>
      <span ref={anchorRef} style={{ display: "none" }} />
      {portalRoot &&
        createPortal(
          <div
            className="cl-video-viewer"
            role="dialog"
            aria-modal="true"
            aria-label="Video"
            // Keeps the page under the portal (a chat bubble's handlers, a
            // clickable post card) from reacting to clicks in here.
            onClick={stopPropagation}
            onDoubleClick={stopPropagation}
            onPointerDown={stopPropagation}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
            onContextMenu={stopPropagation}
          >
            <div className="cl-video-viewer__scrim" onClick={close} />
            <button
              type="button"
              className="cl-video-viewer__close"
              aria-label="Close video"
              onClick={close}
            >
              <AiOutlineClose size={17} />
            </button>
            <VideoPlayer
              ref={videoRef}
              src={src}
              viewer={{ initial, onExit: close }}
              className="cl-video-viewer__player"
              style={{ "--cl-video-ratio": ratio } as CSSProperties}
              videoClassName="cl-video-viewer__media"
            />
          </div>,
          portalRoot,
        )}
    </>
  );
}

export default VideoPlayer;
