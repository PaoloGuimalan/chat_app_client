/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, Icon, useTheme } from "@/reusables/design";
import {
  DeletePostRequest,
  GetEntityMomentsRequest,
  GetMomentTrayRequest,
  GetPostPreviewRequest,
  MarkEphemeralSeenRequest,
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
} from "./ephemeral";

/** How long a photo (or a shared post) stays up before the next one. */
const PHOTO_MS = 6000;

const mediaOf = (post: IPost | undefined) =>
  post?.references?.[0] as any | undefined;

const isSharedMoment = (post: IPost | undefined) => post?.file_type === "shared_post";

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
    <span style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-2)" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, fraction)))}
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
      style={{ width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: primary ? "var(--brand)" : "transparent", color: primary ? "#fff" : "var(--text-2)" }}
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
function MomentViewer() {
  const { entityID } = useParams();
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
  const [sharedPosts, setSharedPosts] = useState<Record<string, IPost | null>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isOwn = entityID === selfEntityId;
  const current = moments?.[index];
  const author = current?.entity;

  const alert = (type: string, content: string) =>
    dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });

  useEffect(() => {
    GetMomentTrayRequest().then(setTray).catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (!entityID) return;
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
  const authorPosition = order.findIndex((entry) => entry.entity.id === entityID);

  const goToAuthor = (offset: number) => {
    const next = order[authorPosition + offset];
    if (!next || authorPosition < 0) {
      navigate("/", { replace: true });
      return;
    }
    navigate(`/moments/${next.entity.id}?post=${next.start_post_id}`, { replace: true });
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
    setMoments((list) =>
      list?.map((m) => (m.post_id === current.post_id ? { ...m, seen: true } : m)) ?? list,
    );
  }, [current?.post_id]);

  // The original post of a shared moment.
  useEffect(() => {
    const sharedId = isSharedMoment(current) ? mediaOf(current)?.reference : null;
    if (!sharedId || sharedId in sharedPosts) return;
    GetPostPreviewRequest({ postID: sharedId })
      .then((post) => setSharedPosts((map) => ({ ...map, [sharedId]: post })))
      .catch(() => setSharedPosts((map) => ({ ...map, [sharedId]: null })));
  }, [current?.post_id]);

  const isVideo = !!mediaOf(current)?.reference_media_type?.startsWith("video");
  const stopped = paused || holdForInput || menuOpen || reporting;

  // Photos and shared posts: a timer. Videos drive progress themselves.
  useEffect(() => {
    if (!current || isVideo || stopped) return;
    const started = Date.now() - progress * PHOTO_MS;
    const timer = setInterval(() => {
      if (isExpired(current.expires_at)) {
        next();
        return;
      }
      const fraction = (Date.now() - started) / PHOTO_MS;
      if (fraction >= 1) {
        clearInterval(timer);
        next();
      } else {
        setProgress(fraction);
      }
    }, 60);
    return () => clearInterval(timer);
  }, [current?.post_id, isVideo, stopped]);

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
      } else if (event.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const deleteCurrent = async () => {
    if (!current || !window.confirm("Delete this Moment? This can't be undone.")) return;
    try {
      await DeletePostRequest([current.post_id]);
      window.dispatchEvent(new CustomEvent(MOMENTS_CHANGED_EVENT));
      const left = (moments ?? []).filter((m) => m.post_id !== current.post_id);
      if (left.length === 0) {
        navigate("/", { replace: true });
        return;
      }
      setMoments(left);
      setIndex(Math.min(index, left.length - 1));
      setProgress(0);
    } catch {
      alert("warning", "We couldn't delete that Moment.");
    }
  };

  const updateCurrent = (patch: Partial<IPost>) =>
    setMoments((list) =>
      list?.map((m) => (m.post_id === current?.post_id ? { ...m, ...patch } : m)) ?? list,
    );

  const ringFraction = moments?.length ? (index + progress) / moments.length : 0;
  const audience = audienceOf(current?.privacy_status);
  const media = mediaOf(current);
  const sharedPost = isSharedMoment(current) ? sharedPosts[media?.reference] : undefined;
  const newCount = order.filter((entry) => entry.has_unseen).length;

  return (
    <div className="cl-redesign" data-theme={theme} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg)", minHeight: 0 }}>
      {reporting && current && (
        <ReportModal targetType="post" targetId={current.post_id} title="Report this Moment" onClose={() => setReporting(false)} />
      )}

      <header style={{ height: "var(--header-h)", flex: "none", display: "flex", alignItems: "center", gap: 16, padding: "0 18px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => navigate("/")} aria-label="Back" style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n="arrow_back" s={18} />
        </button>
        <span style={{ fontSize: "var(--fs-heading)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Moments</span>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
          <MomentRibbon
            entries={order}
            currentEntityId={entityID ?? ""}
            onOpen={(entry) => navigate(`/moments/${entry.entity.id}?post=${entry.start_post_id}`, { replace: true })}
          />
        </div>
        <span style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)", whiteSpace: "nowrap" }}>
          {isOwn
            ? "Your Moment"
            : authorPosition >= 0
              ? `${authorPosition + 1} of ${order.length}${newCount ? ` · ${newCount} new` : ""}`
              : ""}
        </span>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: 20, overflow: "auto" }}>
        {moments !== null && moments.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-2)" }}>
            <Icon n="timelapse" s={36} c="var(--text-3)" />
            <div style={{ marginTop: 8, fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text)" }}>No Moments here</div>
            <div style={{ fontSize: "var(--fs-caption)" }}>They may have expired - Moments last 24 hours.</div>
          </div>
        )}

        {current && author && (
          <>
            {/* Stage */}
            <div style={{ width: "min(460px, 100%)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ProgressRing fraction={ringFraction} size={48}>
                  <Avatar id={author.id} entityId={author.id} name={entityName(author)} src={entityAvatar(author)} size={36} />
                </ProgressRing>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text)" }}>
                    {isOwn ? "Your Moment" : entityName(author)}
                  </span>
                  <span style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon n={audience.icon} s={12} />
                    {audience.label}
                    {isSharedMoment(current) ? " · shared a post" : ""} · posted {timeAgoLabel(current.date_posted)} · {index + 1} of {moments!.length}
                  </span>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 26, padding: "0 10px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand)", fontSize: "var(--fs-meta)", fontWeight: 700, flex: "none" }}>
                  <Icon n="timelapse" s={14} />
                  {timeLeftLabel(current.expires_at)}
                </span>
              </div>

              <div
                onClick={(event) => {
                  // Tap left third = back, the rest = forward, like any stories viewer.
                  const box = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                  if (event.clientX - box.left < box.width / 3) prev();
                  else next();
                }}
                style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", maxHeight: "calc(100vh - var(--header-h) - 190px)", borderRadius: "var(--r-lg)", overflow: "hidden", background: isSharedMoment(current) ? "linear-gradient(165deg,#14233b 0%,#3b6fe0 100%)" : "#000", boxShadow: "var(--shadow-md)", cursor: "pointer" }}
              >
                {/* Segment bars - one per moment of this author. */}
                <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", gap: 4, zIndex: 2 }}>
                  {moments!.map((m, i) => (
                    <div key={m.post_id} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,.35)", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#fff", width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }} />
                    </div>
                  ))}
                </div>

                {isSharedMoment(current) ? (
                  <div style={{ position: "absolute", left: 24, right: 24, top: 40 }} onClick={(e) => e.stopPropagation()}>
                    {sharedPost ? (
                      <SharedPostCard post={sharedPost} onOpen={() => navigate(`/post/${sharedPost.post_id}`)} />
                    ) : sharedPost === null ? (
                      <div style={{ background: "var(--surface)", borderRadius: "var(--r-md)", padding: 16, color: "var(--text-2)", fontSize: "var(--fs-body-sm)" }}>
                        This post is no longer available.
                      </div>
                    ) : null}
                  </div>
                ) : isVideo ? (
                  <video
                    key={current.post_id}
                    ref={videoRef}
                    src={media?.reference}
                    muted={muted}
                    autoPlay
                    playsInline
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      if (isExpired(current.expires_at)) next();
                      else if (v.duration) setProgress(v.currentTime / v.duration);
                    }}
                    onEnded={next}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <img key={current.post_id} src={media?.reference} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                )}

                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, background: "linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55))", pointerEvents: "none" }} />
                {current.caption && (
                  <span style={{ position: "absolute", left: 18, right: 18, bottom: 18, color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.3, pointerEvents: "none", wordBreak: "break-word" }}>
                    {current.caption}
                  </span>
                )}
                <span style={{ position: "absolute", top: 22, right: 14, height: 24, padding: "0 8px", borderRadius: 999, background: "rgba(0,0,0,.4)", color: "#fff", fontSize: "var(--fs-meta)", fontWeight: 650, display: "flex", alignItems: "center", pointerEvents: "none" }}>
                  {isSharedMoment(current) ? "shared post" : isVideo ? "video" : "photo"}
                </span>
              </div>

              <div style={{ alignSelf: "center", position: "relative", display: "flex", alignItems: "center", gap: 4, padding: 5, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, boxShadow: "var(--shadow-md)" }}>
                <ControlBtn icon="skip_previous" title="Previous" onClick={prev} />
                <ControlBtn icon={paused ? "play_arrow" : "pause"} title={paused ? "Play" : "Pause"} primary onClick={() => setPaused((p) => !p)} />
                <ControlBtn icon="skip_next" title="Next" onClick={next} />
                <span style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />
                <ControlBtn icon={muted ? "volume_off" : "volume_up"} title={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)} />
                <ControlBtn icon="more_horiz" title="More" onClick={() => setMenuOpen((o) => !o)} />
                {menuOpen && (
                  <div style={{ position: "absolute", right: 0, bottom: 52, minWidth: 170, padding: 4, borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-md)", zIndex: 5 }}>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (isOwn) deleteCurrent();
                        else setReporting(true);
                      }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer", borderRadius: "var(--r-sm)", color: "var(--pink)", fontSize: "var(--fs-body-sm)", fontWeight: 600 }}
                    >
                      <Icon n={isOwn ? "delete_outline" : "flag"} s={17} />
                      {isOwn ? "Delete Moment" : "Report Moment"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Side panel */}
            {isOwn ? (
              <MomentViewersPanel
                moment={current}
                username={authentication.user.username}
                onDelete={deleteCurrent}
                onChanged={updateCurrent}
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
                onReacted={(emojiId) => updateCurrent({ entity_reaction: emojiId } as any)}
                onTyping={setHoldForInput}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MomentViewer;
