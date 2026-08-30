/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from "dompurify";
import { Avatar, Icon } from "@/reusables/design";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { highlightHashtags } from "@/reusables/hooks/hashtags";

/**
 * A post, rendered read-only, for the moderation review page.
 *
 * WHY THIS IS NOT PostItem
 * ------------------------
 * PostItem is the feed's renderer and it refuses outright to draw anything with
 * `deleted_at` set - it returns "This post is unavailable", which is correct
 * everywhere except here. Teaching it an exception would put a
 * render-deleted-content bypass inside the component every feed, profile and
 * search result already uses, to serve one page. The blast radius is wrong.
 *
 * So this is a deliberate, much smaller second renderer covering only what a
 * review needs: who posted, when, what it said, and what was attached.
 *
 * DELIBERATELY INERT
 * ------------------
 * No reactions, no comment box, no share, no options menu, no view tracking,
 * and nothing navigates. Every one of those either acts on a post that no
 * longer exists or leads somewhere that will refuse to show it. A review is for
 * reading; the only thing to do here is read it.
 */

export interface RemovedPostContent {
  type: "post" | "comment";
  post_id?: string;
  caption?: string | null;
  text?: string | null;
  date_posted?: string;
  created_at?: string;
  deleted_at?: string | null;
  is_removed: boolean;
  entity?: {
    details?: {
      username?: string;
      first_name?: string;
      last_name?: string;
      profile?: string;
      slug?: string;
      name?: string;
    };
  };
  references?: {
    reference_id?: string;
    reference?: string;
    reference_media_type?: string;
  }[];
  /** Which attachment the record is about, when it is about one. */
  flagged_reference_id?: string | null;
}

const displayName = (content: RemovedPostContent) => {
  const details = content.entity?.details;
  if (!details) return "Unknown";
  const full = [details.first_name, details.last_name].filter(Boolean).join(" ");
  return full || details.name || details.username || details.slug || "Unknown";
};

const handleOf = (content: RemovedPostContent) => {
  const details = content.entity?.details;
  return details?.username || details?.slug || null;
};

/** A CDN url, or nothing. Both sentinels the platform uses mean "no picture". */
const pictureOf = (content: RemovedPostContent) => {
  const profile = content.entity?.details?.profile;
  return profile && profile !== "none" && profile !== "N/A" ? profile : undefined;
};

const isImage = (mime?: string) => (mime || "").startsWith("image");
const isVideo = (mime?: string) => (mime || "").startsWith("video");

/**
 * Rings the ONE attachment a media record is about.
 *
 * A post with four photos and one violating frame otherwise shows four images
 * and leaves the reader guessing. Rendered as a wrapper rather than a prop on
 * each media element so the three kinds - image, video, file - are marked
 * identically without repeating the styling three times.
 */
function Flagged({ on, children }: { on: boolean; children: React.ReactNode }) {
  if (!on) return <>{children}</>;
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          borderRadius: "var(--r-sm)",
          outline: "2px solid var(--pink)",
          outlineOffset: 2,
          overflow: "hidden",
          display: "flex",
        }}
      >
        {children}
      </div>
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 6,
          padding: "2px 8px",
          borderRadius: "var(--r-pill)",
          background: "var(--pink)",
          color: "#fff",
          fontSize: "var(--fs-meta)",
          fontWeight: 700,
        }}
      >
        Flagged
      </span>
    </div>
  );
}

function RemovedPostPreview({ content }: { content: RemovedPostContent }) {
  const body = content.type === "comment" ? content.text : content.caption;
  const when = content.date_posted || content.created_at;
  const handle = handleOf(content);
  const references = content.references || [];
  const flagged = content.flagged_reference_id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Author. Plain text, not a link - see the file header. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar
          name={displayName(content)}
          src={pictureOf(content)}
          size={38}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "var(--fs-body-sm)",
              fontWeight: 700,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName(content)}
          </div>
          <div
            style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)" }}
          >
            {handle ? `@${handle}` : null}
            {handle && when ? " · " : null}
            {when ? new Date(when).toLocaleString() : null}
          </div>
        </div>
      </div>

      {body ? (
        <span
          className="cl-text-body"
          style={{ color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}
          /* Hashtags highlighted but NOT clickable - the handler is not bound
             here. A tag reads as it did in the post without offering to
             navigate away from the review. */
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(highlightHashtags(body)),
          }}
        />
      ) : (
        <span
          style={{ color: "var(--text-3)", fontSize: "var(--fs-body-sm)" }}
        >
          This {content.type} had no text.
        </span>
      )}

      {references.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              references.length === 1 ? "1fr" : "repeat(2, 1fr)",
            gap: 8,
          }}
        >
          {references.map((reference, index) => {
            const mime = reference.reference_media_type;
            const key = reference.reference_id || String(index);

            const isFlagged = Boolean(flagged) && reference.reference_id === flagged;

            if (isImage(mime)) {
              return (
                <Flagged key={key} on={isFlagged}>
                  <CachedImage
                    src={reference.reference || ""}
                    className="cl-moderation-media"
                  />
                </Flagged>
              );
            }

            if (isVideo(mime)) {
              return (
                <Flagged key={key} on={isFlagged}>
                <video
                  src={reference.reference}
                  // Controls but no autoplay: a removed video should be
                  // playable for review, not play itself at somebody.
                  controls
                  preload="metadata"
                  className="cl-moderation-media"
                  style={{ background: "#000" }}
                />
                </Flagged>
              );
            }

            // Anything else - a document, an audio file - is named rather than
            // rendered. Nothing here needs to open it.
            return (
              <Flagged key={key} on={isFlagged}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                  color: "var(--text-2)",
                  fontSize: "var(--fs-meta)",
                }}
              >
                <Icon n="attach_file" s={16} c="var(--text-3)" />
                {mime || "attachment"}
              </div>
              </Flagged>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RemovedPostPreview;
