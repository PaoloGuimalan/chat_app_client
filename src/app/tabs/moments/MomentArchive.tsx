/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Btn, Card, Icon } from "@/reusables/design";
import { GetMomentArchiveRequest } from "@/reusables/hooks/requests";
import type { IPost } from "@/reusables/vars/interfaces";

/**
 * Your expired Moments (Archives > Moments). Only the author ever gets here -
 * the endpoint is the requester's own archive - and a tile opens the post
 * page, which lets the author see their own expired moment.
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

  if (loaded && items.length === 0) {
    return (
      <Card pad={28} className="cl-bleed" style={{ textAlign: "center", color: "var(--text-3)" }}>
        <Icon n="timelapse" s={36} />
        <div style={{ fontSize: "var(--fs-body)", fontWeight: 600, marginTop: 8, color: "var(--text-2)" }}>No past Moments</div>
        <div style={{ fontSize: "var(--fs-caption)", marginTop: 4 }}>Moments land here after their 24 hours are up. Only you can see them.</div>
      </Card>
    );
  }

  return (
    <Card pad={12} className="cl-bleed">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
        {items.map((post) => {
          const media = post.references?.[0] as any;
          const shared = post.file_type === "shared_post";
          const isVideo = String(media?.referenceMediaType ?? "").startsWith("video");
          return (
            <button
              key={post.post_id}
              onClick={() => navigate(`/post/${post.post_id}`)}
              style={{ position: "relative", aspectRatio: "9 / 16", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-2)", padding: 0, cursor: "pointer" }}
            >
              {!shared && media?.reference && (isVideo ? (
                <video src={media.reference} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <img src={media.reference} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ))}
              {shared && (
                <span style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--text-3)", fontSize: "var(--fs-meta)" }}>
                  <Icon n="repeat" s={22} />Shared post
                </span>
              )}
              <span style={{ position: "absolute", left: 6, bottom: 6, padding: "2px 7px", borderRadius: 999, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: "var(--fs-meta)", fontWeight: 600 }}>
                {new Date(post.date_posted as any).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
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
