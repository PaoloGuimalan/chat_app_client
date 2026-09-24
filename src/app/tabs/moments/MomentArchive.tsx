/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Btn, Card, Icon } from "@/reusables/design";
import { GetMomentArchiveRequest } from "@/reusables/hooks/requests";
import type { IPost } from "@/reusables/vars/interfaces";
import MomentThumb from "./MomentThumb";
import { canUnarchive, naturalEndOf, timeLeftLabel } from "./ephemeral";
import { MomentArchiveLoader } from "./MomentLoaders";

// The profile's feed column centres its children; without this every state
// of the archive shrank to its content (a lone tile, a narrow empty card).
const FULL_WIDTH = { width: "100%", boxSizing: "border-box" } as const;

/**
 * Your expired Moments (Archives > Moments). Only the author ever gets here -
 * the endpoint is the requester's own archive - and a tile plays it in the
 * Moments viewer (/moments/archive), like a live one.
 */
function MomentArchive() {
  const navigate = useNavigate();
  const [items, setItems] = useState<IPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    GetMomentArchiveRequest(page)
      .then((res) => {
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.post_id));
          return [...prev, ...(res.results ?? []).filter((p) => !seen.has(p.post_id))];
        });
        setHasMore(Boolean(res.next));
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoaded(true));
  }, [page]);

  if (!loaded) {
    return (
      <Card pad={12} className="cl-bleed" style={FULL_WIDTH}>
        <MomentArchiveLoader />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card pad={28} className="cl-bleed" style={{ ...FULL_WIDTH, textAlign: "center", color: "var(--text-3)" }}>
        <Icon n="timelapse" s={36} />
        <div style={{ fontSize: "var(--fs-body)", fontWeight: 600, marginTop: 8, color: "var(--text-2)" }}>No past Moments</div>
        <div style={{ fontSize: "var(--fs-caption)", marginTop: 4 }}>Moments land here after their 24 hours are up. Only you can see them.</div>
      </Card>
    );
  }

  return (
    <Card pad={12} className="cl-bleed" style={FULL_WIDTH}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
        {items.map((post) => {
          return (
            <button
              key={post.post_id}
              onClick={() => navigate(`/moments/archive?post=${post.post_id}`)}
              style={{ position: "relative", aspectRatio: "9 / 16", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-2)", padding: 0, cursor: "pointer" }}
            >
              <MomentThumb post={post} style={{ position: "absolute", inset: 0 }} iconSize={22} />
              <span style={{ position: "absolute", left: 6, bottom: 6, padding: "2px 7px", borderRadius: 999, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: "var(--fs-meta)", fontWeight: 600 }}>
                {new Date(post.date_posted as any).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              {/* Archived by hand with time left: it can still go back. */}
              {canUnarchive(post) && (
                <span style={{ position: "absolute", top: 6, right: 6, display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 999, background: "var(--brand)", color: "#fff", fontSize: "var(--fs-meta)", fontWeight: 700 }}>
                  <Icon n="timelapse" s={12} />
                  {timeLeftLabel(naturalEndOf(post))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <Btn variant="soft" size="sm" onClick={() => setPage((p) => p + 1)}>Load more</Btn>
        </div>
      )}
    </Card>
  );
}

export default MomentArchive;
