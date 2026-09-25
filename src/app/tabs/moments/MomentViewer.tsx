/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, Icon, useTheme } from "@/reusables/design";
import {
  DeletePostRequest,
  GetEntityMomentsRequest,
  GetMomentTrayRequest,
  GetPostPreviewRequest,
  GetMomentArchiveRequest,
  MarkEphemeralSeenRequest,
  UpdateMomentRequest,
} from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import type {
  AuthenticationInterface,
  IMomentTray,
  IPost,
} from "@/reusables/vars/interfaces";
import ReportModal from "@/app/widgets/modals/ReportModal";
import { SharedPostCard } from "./CreateMomentModal";
import MomentRibbon from "./MomentRibbon";
import MomentSidePanel from "./MomentSidePanel";
import MomentViewersPanel from "./MomentViewersPanel";
import {
  MOMENTS_CHANGED_EVENT,
  audienceOf,
  entityAvatar,
  entityFirstName,
  entityName,
  isExpired,
  timeAgoLabel,
  timeLeftLabel,
  canUnarchive,
  naturalEndOf,
  isStillPhoto,
  posterOf,
  STILL_PHOTO_MS,
} from "./ephemeral";

/** Below this the side panel stacks under the stage instead of beside it. */
const SIDE_BY_SIDE_MIN_WIDTH = 1000;

/**
 * How long a photo uploaded as an image (the web's) or a shared post stays
 * up - the same 6s the app uses. A device-encoded still photo uses its own
 * length (STILL_PHOTO_MS); a video, or a photo with sound, plays for its own
 * length.
 */
const PHOTO_MS = 6000;

const mediaOf = (post: IPost | undefined) =>
  post?.references?.[0] as any | undefined;

const isSharedMoment = (post: IPost | undefined) =>
  post?.file_type === "shared_post";

/** The ring around the author: how far through their moments you are. */
function ProgressRing({
  fraction,
  size,
  children,
}: {
  fraction: number;
  size: number;
  children: React.ReactNode;
}) {
  const r = size / 2 - 2;
  const circumference = 2 * Math.PI * r;
  return (
    <span
      style={{ position: "relative", width: size, height: size, flex: "none" }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border-2)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference * (1 - Math.min(1, Math.max(0, fraction)))
          }
        />
      </svg>
      <span style={{ position: "absolute", left: 6, top: 6 }}>{children}</span>
    </span>
  );
}

function ControlBtn({
  icon,
  onClick,
  primary,
  title,
}: {
  icon: string;
  onClick: () => void;
  primary?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: primary ? "var(--brand)" : "transparent",
        color: primary ? "#fff" : "var(--text-2)",
      }}
    >
      <Icon n={icon} s={22} />
    </button>
  );
}

/**
 * The Moment viewer (designs 1b / 1c): plays one author's moments inside the
 * app, oldest first. A header timeline places every author along the last
 * 24h; the stage shows the moment with previous / pause / next / mute; the
 * side panel is React + Reply + "More from X today" for someone else's
 * moment, and the Viewers list with Archive / Audience / Delete for yours.
 *
 * Photos and shared posts advance after 6s, videos when they end. A moment
 * that runs out while it is open is skipped - the device clock is the hard
 * stop, the server only filters what it sends.
 */
/**
 * `archive`: plays YOUR expired moments (Archives > Moments), newest first,
 * starting at `?post=`. No board ribbon, no author hopping, no expiry skip -
 * and the viewers panel stays, so who saw an old moment is still visible.
 */
function MomentViewer({ archive = false }: { archive?: boolean }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const startPostId = searchParams.get("post");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const selfEntityId =
    authentication.active_entity_context?.id ?? authentication.user.entity_id;

  const [tray, setTray] = useState<IMomentTray | null>(null);
  const [moments, setMoments] = useState<IPost[] | null>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [holdForInput, setHoldForInput] = useState(false);
  const [sharedPosts, setSharedPosts] = useState<Record<string, IPost | null>>(
    {},
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const entityID = archive ? selfEntityId : params.entityID;
  const isOwn = entityID === selfEntityId;
  // Your archive lives on YOUR profile - the page's when you are acting as a
  // page (its profile is /<slug>, falling back to the realm id like the rest
  // of the app), your own otherwise.
  const actingContext = authentication.active_entity_context;
  const actingProfilePath =
    actingContext?.entity_type === "realm"
      ? `/${actingContext.slug || actingContext.realm_id}`
      : `/${authentication.user.username}`;
  const archivePath = `${actingProfilePath}?feed=archives`;
  const current = moments?.[index];
  const author = current?.entity;

  const alert = (type: string, content: string) =>
    dispatch({
      type: SET_MUTATE_ALERTS,
      payload: { alerts: { type, content } },
    });

  useEffect(() => {
    if (archive) return;
    GetMomentTrayRequest()
      .then(setTray)
      .catch((err) => console.log(err));
  }, [archive]);

  // Archive mode: page through the archive until the opened moment is in
  // hand (it may be past the first page if "Load more" was used).
  useEffect(() => {
    if (!archive) return;
    let cancelled = false;
    setMoments(null);
    (async () => {
      const list: IPost[] = [];
      for (let page = 1; page <= 10; page++) {
        const res = await GetMomentArchiveRequest(page).catch(() => null);
        if (!res) break;
        list.push(...(res.results ?? []));
        if (!res.next || list.some((m) => m.post_id === startPostId)) break;
      }
      if (cancelled) return;
      setMoments(list);
      setIndex(
        Math.max(
          0,
          list.findIndex((m) => m.post_id === startPostId),
        ),
      );
      setProgress(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [archive, startPostId]);

  useEffect(() => {
    if (archive || !entityID) return;
    setMoments(null);
    GetEntityMomentsRequest(entityID)
      .then((list) => {
        setMoments(list);
        const at = list.findIndex((m) => m.post_id === startPostId);
        const firstUnseen = list.findIndex((m) => !m.seen);
        setIndex(at >= 0 ? at : firstUnseen >= 0 ? firstUnseen : 0);
        setProgress(0);
      })
      .catch(() => setMoments([]));
  }, [entityID]);

  // Authors in the order the tray plays them.
  const order = tray?.results ?? [];
  const authorPosition = order.findIndex(
    (entry) => entry.entity.id === entityID,
  );

  const goToAuthor = (offset: number) => {
    if (archive) {
      // Past the last archived moment: back to the archive grid.
      if (offset > 0) navigate(archivePath, { replace: true });
      return;
    }
    const next = order[authorPosition + offset];
    if (!next || authorPosition < 0) {
      navigate("/", { replace: true });
      return;
    }
    navigate(`/moments/${next.entity.id}?post=${next.start_post_id}`, {
      replace: true,
    });
  };

  const next = () => {
    if (!moments) return;
    if (index + 1 < moments.length) {
      setIndex(index + 1);
      setProgress(0);
    } else {
      goToAuthor(1);
    }
  };

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setProgress(0);
    } else {
      goToAuthor(-1);
    }
  };

  // Mark seen as soon as someone else's moment is on screen.
  useEffect(() => {
    if (!current || isOwn || current.seen) return;
    MarkEphemeralSeenRequest("moment", current.post_id);
    setMoments(
      (list) =>
        list?.map((m) =>
          m.post_id === current.post_id ? { ...m, seen: true } : m,
        ) ?? list,
    );
  }, [current?.post_id]);

  // The original post of a shared moment.
  useEffect(() => {
    const sharedId = isSharedMoment(current)
      ? mediaOf(current)?.reference
      : null;
    if (!sharedId || sharedId in sharedPosts) return;
    GetPostPreviewRequest({ postID: sharedId })
      .then((post) => setSharedPosts((map) => ({ ...map, [sharedId]: post })))
      .catch(() => setSharedPosts((map) => ({ ...map, [sharedId]: null })));
  }, [current?.post_id]);

  // A photo without sound is a 30s still video: shown as its poster for its
  // whole length (the same picture, without loading the file). A photo WITH
  // sound, or a video, plays as a video.
  const stillPhoto = isStillPhoto(current);
  const photoMs = stillPhoto ? current?.details?.duration_ms || STILL_PHOTO_MS : PHOTO_MS;
  const isVideo = !stillPhoto && !!mediaOf(current)?.reference_media_type?.startsWith("video");
  const stopped = paused || holdForInput || menuOpen || reporting;

  // Photos and shared posts: a timer. Videos drive progress themselves.
  useEffect(() => {
    if (!current || isVideo || stopped) return;
    const started = Date.now() - progress * photoMs;
    const timer = setInterval(() => {
      if (!archive && isExpired(current.expires_at)) {
        next();
        return;
      }
      const fraction = (Date.now() - started) / photoMs;
      if (fraction >= 1) {
        clearInterval(timer);
        next();
      } else {
        setProgress(fraction);
      }
    }, 60);
    return () => clearInterval(timer);
  }, [current?.post_id, isVideo, stopped, photoMs]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stopped) video.pause();
    else video.play().catch(() => {});
  }, [stopped, current?.post_id]);

  // ← / → / space, unless typing a reply.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
      else if (event.key === " ") {
        event.preventDefault();
        setPaused((p) => !p);
      } else if (event.key === "Escape") navigate(archive ? archivePath : "/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /** Drops the current moment from what is playing (deleted or archived). */
  const removeCurrent = () => {
    if (!current) return;
    window.dispatchEvent(new CustomEvent(MOMENTS_CHANGED_EVENT));
    const left = (moments ?? []).filter((m) => m.post_id !== current.post_id);
    if (left.length === 0) {
      navigate(archive ? archivePath : "/", { replace: true });
      return;
    }
    setMoments(left);
    setIndex(Math.min(index, left.length - 1));
    setProgress(0);
  };

  const deleteCurrent = async () => {
    if (
      !current ||
      !window.confirm("Delete this Moment? This can't be undone.")
    )
      return;
    try {
      await DeletePostRequest([current.post_id]);
      removeCurrent();
    } catch {
      alert("warning", "We couldn't delete that Moment.");
    }
  };

  // Ends it now - it moves to your Archives, where it would have gone at 24h.
  const archiveCurrent = async () => {
    if (!current) return;
    try {
      await UpdateMomentRequest(current.post_id, { archive: true });
      alert("success", "Moment moved to your archive.");
      removeCurrent();
    } catch {
      alert("warning", "We couldn't archive that Moment.");
    }
  };

  // Back on the board while its 24h last - and out of the archive being played.
  const unarchiveCurrent = async () => {
    if (!current) return;
    try {
      await UpdateMomentRequest(current.post_id, { archive: false });
      alert("success", "Moment is back on your board.");
      removeCurrent();
    } catch (err: any) {
      alert("warning", err?.message || "We couldn't unarchive that Moment.");
    }
  };

  const updateCurrent = (patch: Partial<IPost>) =>
    setMoments(
      (list) =>
        list?.map((m) =>
          m.post_id === current?.post_id ? { ...m, ...patch } : m,
        ) ?? list,
    );

  const ringFraction = moments?.length
    ? (index + progress) / moments.length
    : 0;
  const audience = audienceOf(current?.privacy_status);
  const media = mediaOf(current);
  const sharedPost = isSharedMoment(current)
    ? sharedPosts[media?.reference]
    : undefined;
  const newCount = order.filter((entry) => entry.has_unseen).length;

  // The side panel is exactly the stage's height and starts at its top -
  // measured, because the stage's size comes from its aspect ratio and the
  // viewport, not from anything the panel could align to in CSS.
  //
  // Only in the side-by-side layout. Narrower than that, the panel stacks
  // under the stage and takes its natural height - squeezing both into one
  // row made the page overflow sideways, and the scrollbar that came and went
  // with it resized the stage, re-measured, and looped until React gave up
  // (the white screen on resize).
  const screenWidth: number = useSelector(
    (state: any) => state.screensizelistener?.W ?? window.innerWidth,
  );
  const sideBySide = screenWidth >= SIDE_BY_SIDE_MIN_WIDTH;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const panelSlotRef = useRef<HTMLDivElement | null>(null);
  const [stageBox, setStageBox] = useState<{
    top: number;
    height: number;
  } | null>(null);
  const hasStage = !!current && !!author;
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const slot = panelSlotRef.current;
    if (!sideBySide || !stage || !slot) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      // Next frame, not inside the observer callback: setting state there is
      // what trips "ResizeObserver loop" when the layout is still settling.
      frame = requestAnimationFrame(() => {
        const s = stage.getBoundingClientRect();
        const o = slot.getBoundingClientRect();
        const next = {
          top: Math.round(s.top - o.top),
          height: Math.round(s.height),
        };
        setStageBox((prev) =>
          prev && prev.top === next.top && prev.height === next.height
            ? prev
            : next,
        );
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [sideBySide, hasStage]);

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        minHeight: 0,
      }}
    >
      {reporting && current && (
        <ReportModal
          targetType="post"
          targetId={current.post_id}
          title="Report this Moment"
          onClose={() => setReporting(false)}
        />
      )}

      <header
        style={{
          height: "var(--header-h)",
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 18px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => navigate(archive ? archivePath : "/")}
          aria-label="Back"
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon n="arrow_back" s={18} />
        </button>
        <span
          style={{
            fontSize: "var(--fs-heading)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text)",
          }}
        >
          Moments
        </span>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          {!archive && (
            <MomentRibbon
              entries={order}
              currentEntityId={entityID ?? ""}
              onOpen={(entry) =>
                navigate(
                  `/moments/${entry.entity.id}?post=${entry.start_post_id}`,
                  { replace: true },
                )
              }
            />
          )}
        </div>
        <span
          style={{
            fontSize: "var(--fs-meta)",
            color: "var(--text-3)",
            whiteSpace: "nowrap",
          }}
        >
          {archive
            ? "Archive"
            : isOwn
              ? "Your Moment"
              : authorPosition >= 0
                ? `${authorPosition + 1} of ${order.length}${newCount ? ` · ${newCount} new` : ""}`
                : ""}
        </span>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: sideBySide ? "row" : "column",
          alignItems: "center",
          justifyContent: sideBySide ? "center" : "flex-start",
          gap: sideBySide ? 24 : 16,
          padding: sideBySide ? 20 : "16px 12px",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {moments !== null && moments.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-2)" }}>
            <Icon n="timelapse" s={36} c="var(--text-3)" />
            <div
              style={{
                marginTop: 8,
                fontSize: "var(--fs-body)",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              No Moments here
            </div>
            <div style={{ fontSize: "var(--fs-caption)" }}>
              They may have expired - Moments last 24 hours.
            </div>
          </div>
        )}

        {current && author && (
          <>
            {/* Stage */}
            <div
              style={{
                width: "min(460px, 100%)",
                flex: "none",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ProgressRing fraction={ringFraction} size={48}>
                  <Avatar
                    id={author.id}
                    entityId={author.id}
                    name={entityName(author)}
                    src={entityAvatar(author)}
                    size={36}
                  />
                </ProgressRing>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "start",
                    gap: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-body)",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {isOwn ? "Your Moment" : entityName(author)}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--fs-meta)",
                      color: "var(--text-3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon n={audience.icon} s={12} />
                    {audience.label}
                    {isSharedMoment(current) ? " · shared a post" : ""} · posted{" "}
                    {timeAgoLabel(current.date_posted)} · {index + 1} of{" "}
                    {moments!.length}
                  </span>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    height: 26,
                    padding: "0 10px",
                    borderRadius: 999,
                    background: "var(--brand-soft)",
                    color: "var(--brand)",
                    fontSize: "var(--fs-meta)",
                    fontWeight: 700,
                    flex: "none",
                  }}
                >
                  <Icon n={archive ? "inventory_2" : "timelapse"} s={14} />
                  {archive
                    ? canUnarchive(current)
                      ? `Archived · ${timeLeftLabel(naturalEndOf(current))}`
                      : new Date(current.date_posted as any).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )
                    : timeLeftLabel(current.expires_at)}
                </span>
              </div>

              <div
                ref={stageRef}
                onClick={(event) => {
                  // Tap left third = back, the rest = forward, like any stories viewer.
                  const box = (
                    event.currentTarget as HTMLDivElement
                  ).getBoundingClientRect();
                  if (event.clientX - box.left < box.width / 3) prev();
                  else next();
                }}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  maxHeight: "calc(100vh - var(--header-h) - 190px)",
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  background: isSharedMoment(current)
                    ? "linear-gradient(165deg,#14233b 0%,#3b6fe0 100%)"
                    : "#000",
                  boxShadow: "var(--shadow-md)",
                  cursor: "pointer",
                }}
              >
                {/* Segment bars - one per moment of this author. */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    right: 10,
                    display: "flex",
                    gap: 4,
                    zIndex: 2,
                  }}
                >
                  {moments!.map((m, i) => (
                    <div
                      key={m.post_id}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
                        background: "rgba(255,255,255,.35)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "#fff",
                          width:
                            i < index
                              ? "100%"
                              : i === index
                                ? `${progress * 100}%`
                                : "0%",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {isSharedMoment(current) ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 24,
                      right: 24,
                      top: 40,
                      bottom: 24,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        pointerEvents: "auto",
                        maxHeight: "100%",
                        overflow: "hidden",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sharedPost ? (
                        <SharedPostCard
                          post={sharedPost}
                          onOpen={() => navigate(`/post/${sharedPost.post_id}`)}
                        />
                      ) : sharedPost === null ? (
                        <div
                          style={{
                            background: "var(--surface)",
                            borderRadius: "var(--r-md)",
                            padding: 16,
                            color: "var(--text-2)",
                            fontSize: "var(--fs-body-sm)",
                          }}
                        >
                          This post is no longer available.
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : isVideo ? (
                  <video
                    key={current.post_id}
                    ref={videoRef}
                    src={media?.reference}
                    // The poster while it buffers - not a black frame.
                    poster={posterOf(current) ?? undefined}
                    muted={muted}
                    autoPlay
                    playsInline
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      if (!archive && isExpired(current.expires_at)) next();
                      else if (v.duration)
                        setProgress(v.currentTime / v.duration);
                    }}
                    onEnded={next}
                    // Whole, as the app shows it: an edit made on a phone is
                    // framed by its author - cropping it would cut that off.
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <img
                    key={current.post_id}
                    src={stillPhoto ? posterOf(current) ?? media?.reference : media?.reference}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 160,
                    background:
                      "linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55))",
                    pointerEvents: "none",
                  }}
                />
                {current.caption && (
                  <span
                    style={{
                      position: "absolute",
                      left: 18,
                      right: 18,
                      bottom: 18,
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      pointerEvents: "none",
                      wordBreak: "break-word",
                    }}
                  >
                    {current.caption}
                  </span>
                )}
                <span
                  style={{
                    position: "absolute",
                    top: 22,
                    right: 14,
                    height: 24,
                    padding: "0 8px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,.4)",
                    color: "#fff",
                    fontSize: "var(--fs-meta)",
                    fontWeight: 650,
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  {isSharedMoment(current)
                    ? "shared post"
                    : // what it was MADE from: a photo with sound plays as
                      // a video but is still a photo
                      current.details?.source === "photo" || !isVideo
                      ? "photo"
                      : "video"}
                </span>
              </div>

              <div
                style={{
                  alignSelf: "center",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 5,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <ControlBtn
                  icon="skip_previous"
                  title="Previous"
                  onClick={prev}
                />
                <ControlBtn
                  icon={paused ? "play_arrow" : "pause"}
                  title={paused ? "Play" : "Pause"}
                  primary
                  onClick={() => setPaused((p) => !p)}
                />
                <ControlBtn icon="skip_next" title="Next" onClick={next} />
                <span
                  style={{
                    width: 1,
                    height: 22,
                    background: "var(--border)",
                    margin: "0 4px",
                  }}
                />
                <ControlBtn
                  icon={muted ? "volume_off" : "volume_up"}
                  title={muted ? "Unmute" : "Mute"}
                  onClick={() => setMuted((m) => !m)}
                />
                <ControlBtn
                  icon="more_horiz"
                  title="More"
                  onClick={() => setMenuOpen((o) => !o)}
                />
                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: 52,
                      minWidth: 170,
                      padding: 4,
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      boxShadow: "var(--shadow-md)",
                      zIndex: 5,
                    }}
                  >
                    {isOwn && archive && canUnarchive(current) && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          unarchiveCurrent();
                        }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: "var(--fs-body-sm)", fontWeight: 600 }}
                      >
                        <Icon n="unarchive" s={17} />
                        Unarchive Moment
                      </button>
                    )}
                    {isOwn && !archive && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          archiveCurrent();
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          borderRadius: "var(--r-sm)",
                          color: "var(--text)",
                          fontSize: "var(--fs-body-sm)",
                          fontWeight: 600,
                        }}
                      >
                        <Icon n="inventory_2" s={17} />
                        Archive Moment
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (isOwn) deleteCurrent();
                        else setReporting(true);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        borderRadius: "var(--r-sm)",
                        color: "var(--pink)",
                        fontSize: "var(--fs-body-sm)",
                        fontWeight: 600,
                      }}
                    >
                      <Icon n={isOwn ? "delete_outline" : "flag"} s={17} />
                      {isOwn ? "Delete Moment" : "Report Moment"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Side panel - pinned to the stage's top and height. */}
            <div
              ref={panelSlotRef}
              style={
                sideBySide
                  ? {
                      position: "relative",
                      width: 360,
                      flex: "none",
                      alignSelf: "stretch",
                    }
                  : { width: "min(460px, 100%)", flex: "none" }
              }
            >
              <div
                style={
                  sideBySide
                    ? {
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: stageBox?.top ?? 0,
                        height: stageBox?.height ?? "auto",
                        display: "flex",
                      }
                    : { display: "flex", maxHeight: 560 }
                }
              >
                {isOwn ? (
                  <MomentViewersPanel
                    moment={current}
                    onDelete={deleteCurrent}
                    onArchive={archiveCurrent}
                    onUnarchive={unarchiveCurrent}
                    onChanged={updateCurrent}
                    archived={archive}
                  />
                ) : (
                  <MomentSidePanel
                    moment={current}
                    moments={moments!}
                    index={index}
                    authorFirstName={entityFirstName(author)}
                    onJump={(i) => {
                      setIndex(i);
                      setProgress(0);
                    }}
                    onReacted={(emojiId) =>
                      updateCurrent({ entity_reaction: emojiId } as any)
                    }
                    onTyping={setHoldForInput}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MomentViewer;

