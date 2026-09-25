/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Card, Icon } from "@/reusables/design";
import { GetMomentTrayRequest } from "@/reusables/hooks/requests";
import type { IMomentTray, IMomentTrayEntry } from "@/reusables/vars/interfaces";
import CreateMomentModal from "./CreateMomentModal";
import { MomentsBoardLoader } from "./MomentLoaders";
import {
  MOMENTS_CHANGED_EVENT,
  entityAvatar,
  entityFirstName,
  remainingFraction,
} from "./ephemeral";

// Under 4h left, the bar turns pink - "about to go".
const EXPIRING_FRACTION = 4 / 24;

const SHARED_BG = "linear-gradient(160deg,#14233b,#3b6fe0)";
const PLACEHOLDER_BG = "linear-gradient(160deg,#1c7def,#5aa9ff)";

const tileBackground = (entry: IMomentTrayEntry) => {
  const latest = entry.latest;
  // A shared post's thumbnail is the shared post's own photo (the server
  // resolves it); only a text-only share falls back to the gradient.
  if (latest.thumbnail && !latest.media_type?.startsWith("video")) {
    return `center / cover no-repeat url("${latest.thumbnail}")`;
  }
  return latest.is_shared ? SHARED_BG : PLACEHOLDER_BG;
};

// Encoded moments carry `source` (their thumbnail is a poster image, so the
// media type no longer says "video"); older ones only their media type.
const typeIcon = (entry: IMomentTrayEntry) =>
  entry.latest.is_shared
    ? "repeat"
    : entry.latest.source
      ? entry.latest.source === "video"
        ? "play_circle"
        : null
      : entry.latest.media_type?.startsWith("video")
        ? "play_circle"
        : null;

/** The first frame of a video moment, drawn under its tile's gradient. */
function VideoFrame({ src }: { src: string }) {
  return (
    <video
      src={`${src}#t=0.1`}
      muted
      playsInline
      preload="metadata"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

function RemainingBar({ expiresAt }: { expiresAt: string }) {
  const fraction = remainingFraction(expiresAt);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "rgba(255,255,255,.3)" }}>
      <div
        style={{
          width: `${Math.round(fraction * 100)}%`,
          height: "100%",
          background: fraction < EXPIRING_FRACTION ? "var(--pink)" : "#fff",
        }}
      />
    </div>
  );
}

/**
 * The Moments board at the top of the feed (design 1a): one large tile for the
 * newest moment you have not seen, an "Add Moment" tile, then one tile per
 * author - newest first, unseen ones marked and full-strength, seen ones
 * faded. Each tile's bottom bar is how much of its 24h is left.
 */
function MomentsBoard() {
  const navigate = useNavigate();
  const [tray, setTray] = useState<IMomentTray | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () =>
    GetMomentTrayRequest()
      .then(setTray)
      .catch((err) => {
        console.log(err);
        // An empty board rather than a skeleton that never resolves.
        setTray((prev) => prev ?? { results: [], new_count: 0, total: 0 });
      });

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener(MOMENTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(MOMENTS_CHANGED_EVENT, handler);
  }, []);

  const entries = tray?.results ?? [];
  // The large tile: the newest author with something unseen.
  const featured = useMemo(
    () =>
      entries
        .filter((entry) => entry.has_unseen)
        .sort((a, b) => +new Date(b.latest_at) - +new Date(a.latest_at))[0] ?? null,
    [entries],
  );
  const rest = entries.filter((entry) => entry !== featured);

  const open = (entry: IMomentTrayEntry) =>
    navigate(`/moments/${entry.entity.id}?post=${entry.start_post_id}`);

  const seeAll = () => {
    const first = featured ?? entries[0];
    if (first) open(first);
  };

  return (
    <Card pad="12px 14px 14px" className="cl-bleed" style={{ marginBottom: 8 }}>
      {creating && <CreateMomentModal onClose={() => setCreating(false)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "var(--fs-section-title)", fontWeight: 750, letterSpacing: "-0.01em", color: "var(--text)" }}>
            Moments
          </span>
          {!!tray?.new_count && <Badge>{tray.new_count} new</Badge>}
        </div>
        {entries.length > 0 && (
          <button
            onClick={seeAll}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "var(--fs-label)", fontWeight: 700, color: "var(--brand)" }}
          >
            See all · {tray?.total ?? entries.length}
          </button>
        )}
      </div>

      {tray === null ? (
        <MomentsBoardLoader />
      ) : (
      <div className="cl-rail-track" style={{ display: "flex", gap: 8, height: 150, overflowX: "auto" }}>
        {featured && (
          <button
            onClick={() => open(featured)}
            style={{ width: 212, flex: "none", position: "relative", borderRadius: "var(--r-md)", overflow: "hidden", border: "none", padding: 0, cursor: "pointer", background: tileBackground(featured), textAlign: "left" }}
          >
            {featured.latest.thumbnail && featured.latest.media_type?.startsWith("video") && (
              <VideoFrame src={featured.latest.thumbnail} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.1) 100%)" }} />
            <div style={{ position: "absolute", left: 10, top: 10, right: 10, display: "flex", alignItems: "center", gap: 6, color: "#fff" }}>
              {/* The white ring on a ROUND wrapper: Avatar's own box is
                  square (it hosts the presence marker), so a shadow on it
                  drew a white square. */}
              <span style={{ display: "inline-flex", borderRadius: "50%", boxShadow: "0 0 0 1.5px #fff", flex: "none" }}>
                <Avatar
                  id={featured.entity.id}
                  name={entityFirstName(featured.entity)}
                  src={entityAvatar(featured.entity)}
                  size={24}
                  online={false}
                />
              </span>
              <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700 }}>{entityFirstName(featured.entity)}</span>
              {typeIcon(featured) && <Icon n={typeIcon(featured)!} s={15} style={{ marginLeft: "auto" }} />}
            </div>
            {featured.latest.caption && (
              <span className="ellipsis-2-lines" style={{ position: "absolute", left: 12, right: 12, bottom: 18, color: "#fff", fontSize: "var(--fs-body)", fontWeight: 700, lineHeight: 1.3 }}>
                {featured.latest.caption}
              </span>
            )}
            <RemainingBar expiresAt={featured.latest.expires_at} />
          </button>
        )}

        <button
          onClick={() => setCreating(true)}
          style={{ width: 100, flex: "none", borderRadius: "var(--r-md)", border: "1.5px dashed var(--border-2)", background: "var(--surface-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}
        >
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n="add" s={22} />
          </span>
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text)" }}>Add Moment</span>
        </button>

        {rest.map((entry) => (
          <button
            key={entry.entity.id}
            onClick={() => open(entry)}
            title={entityFirstName(entry.entity)}
            style={{ width: 100, flex: "none", position: "relative", borderRadius: "var(--r-md)", overflow: "hidden", border: "none", padding: 0, cursor: "pointer", background: tileBackground(entry), opacity: entry.has_unseen || entry.is_self ? 1 : 0.7 }}
          >
            {entry.latest.thumbnail && entry.latest.media_type?.startsWith("video") && (
              <VideoFrame src={entry.latest.thumbnail} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.6) 100%)" }} />
            {typeIcon(entry) && (
              <Icon n={typeIcon(entry)!} s={14} c="#fff" style={{ position: "absolute", top: 6, right: 6 }} />
            )}
            {entry.has_unseen && (
              <span style={{ position: "absolute", top: 7, left: 7, width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", boxShadow: "0 0 0 2px #fff" }} />
            )}
            <span style={{ position: "absolute", left: 8, right: 8, bottom: 10, color: "#fff", fontSize: "var(--fs-caption)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
              {entry.is_self ? "You" : entityFirstName(entry.entity)}
            </span>
            <RemainingBar expiresAt={entry.latest.expires_at} />
          </button>
        ))}

        {tray && entries.length === 0 && (
          <div style={{ alignSelf: "center", paddingLeft: 8, color: "var(--text-3)", fontSize: "var(--fs-caption)", maxWidth: 260 }}>
            No Moments from your circle yet. Moments disappear after 24 hours.
          </div>
        )}
      </div>
      )}
    </Card>
  );
}

export default MomentsBoard;
