/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Icon, useTheme } from "@/reusables/design";
import { GetModerationDetailRequest } from "@/reusables/hooks/requests";
import RemovedPostPreview from "./RemovedPostPreview";

/**
 * "Your content was removed. Here is why."
 *
 * The one surface that renders soft-deleted content, and only to the person it
 * belonged to (or platform staff). Everything about the page is shaped by that:
 * it opens from a notification, it shows the content as it was, and it shows
 * the machine's reasoning in enough detail to be argued with.
 *
 * A 404 from the endpoint means EITHER no such record OR no permission - the
 * server does not distinguish, so that a stranger cannot learn that somebody's
 * content was removed. This page must not distinguish either, which is why
 * there is one "not available" state rather than separate missing/forbidden
 * ones.
 */

interface ModerationCategory {
  code: string;
  score: number;
}

interface ModerationDetailData {
  moderation_id: string;
  viewer_is_owner: boolean;
  content: {
    type: "post" | "comment";
    id: string;
    caption?: string | null;
    text?: string | null;
    post_id?: string | null;
    content_type?: string;
    date_posted?: string;
    created_at?: string;
    deleted_at?: string | null;
    is_removed: boolean;
    references?: { id: string; reference: string; media_type: string }[];
  };
  moderation: {
    verdict: string | null;
    top_score: number | null;
    categories: ModerationCategory[];
    unevaluated: string[];
    removed: boolean;
    enforced_at?: string | null;
    report_id?: string | null;
    reviewed_text?: string | null;
  };
}

/** "hate_speech" -> "Hate speech". The codes mirror Report.REASON_CHOICES. */
const readableCategory = (code: string) =>
  code
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

function ModerationDetail() {
  const { moderationId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [detail, setDetail] = useState<ModerationDetailData | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [unavailable, setUnavailable] = useState<boolean>(false);

  useEffect(() => {
    if (!moderationId) return;
    let cancelled = false;

    GetModerationDetailRequest(moderationId)
      .then((response: any) => {
        if (cancelled) return;
        if (response?.status && response?.data) setDetail(response.data);
        else setUnavailable(true);
        setIsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setUnavailable(true);
        setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [moderationId]);

  const content = detail?.content;
  const moderation = detail?.moderation;
  // Only used to decide whether the reviewed text is worth showing twice.
  const body = content?.type === "comment" ? content?.text : content?.caption;

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%" }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "16px 18px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          // App.tsx's root carries `.App { text-align: center }` - a
          // Create-React-App template leftover that every page inherits and
          // that the older screens each override with tw-text-left. Without
          // this the whole review reads as centred prose.
          textAlign: "left",
        }}
      >
        <Card pad={14}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="cl-rowbtn"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 6,
                borderRadius: "var(--r-sm)",
                display: "flex",
              }}
            >
              <Icon n="arrow_back" s={20} c="var(--text-2)" />
            </button>
            <div
              style={{
                fontSize: "var(--fs-body)",
                fontWeight: 750,
                color: "var(--text)",
              }}
            >
              Content review
            </div>
          </div>
        </Card>

        {!isLoaded && (
          <Card pad={20} style={{ color: "var(--text-2)" }}>
            Loading…
          </Card>
        )}

        {isLoaded && unavailable && (
          <Card pad={24} style={{ textAlign: "center" }}>
            <Icon n="help_outline" s={32} c="var(--text-3)" />
            <div
              style={{
                marginTop: 10,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              This review isn&apos;t available
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: "var(--fs-body-sm)",
                color: "var(--text-2)",
              }}
            >
              It may have been removed, or it isn&apos;t yours to view.
            </div>
          </Card>
        )}

        {isLoaded && detail && content && moderation && (
          <>
            {/* The verdict first. Somebody arriving from a notification wants
                the answer, not the evidence - the content is below, for
                checking it against. */}
            <Card pad={16}>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--r-sm)",
                    background: "var(--pink-soft)",
                    color: "var(--pink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  <Icon n="gavel" s={20} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "var(--fs-body)",
                      fontWeight: 750,
                      color: "var(--text)",
                    }}
                  >
                    {moderation.removed
                      ? `This ${content.type} was removed`
                      : `This ${content.type} was reviewed`}
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: "var(--fs-body-sm)",
                      color: "var(--text-2)",
                      lineHeight: 1.45,
                    }}
                  >
                    {detail.viewer_is_owner
                      ? "An automated review found it likely breaks the community guidelines."
                      : "Shown to you as a platform moderator."}
                  </div>

                  {moderation.categories.length > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {moderation.categories.map((category) => (
                        <span
                          key={category.code}
                          className="cl-topic-pill cl-topic-pill--3"
                          /* The score is shown, not hidden. "We think this is
                             nudity, 0.81" is arguable in a way "this broke the
                             rules" is not - and arguing with it is the point
                             of showing somebody their own removal. */
                          title={`Confidence ${category.score.toFixed(2)}`}
                        >
                          {readableCategory(category.code)} ·{" "}
                          {category.score.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  )}

                  {moderation.unevaluated.length > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: "1px solid var(--border)",
                        fontSize: "var(--fs-meta)",
                        color: "var(--text-3)",
                        lineHeight: 1.45,
                      }}
                      /* The full list on hover rather than inline. A category
                         nobody checked is not a category that came back clean,
                         so this must be SAID - but spelling out five of them
                         above the content buried the thing the reader came
                         for. */
                      title={moderation.unevaluated
                        .map(readableCategory)
                        .join(", ")}
                    >
                      {moderation.unevaluated.length} other categor
                      {moderation.unevaluated.length === 1 ? "y was" : "ies were"}{" "}
                      not checked
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* The content as it was. This is the part no other page will show
                once it is removed. */}
            <Card pad={16}>
              <div
                style={{
                  fontSize: "var(--fs-meta)",
                  color: "var(--text-3)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 700,
                }}
              >
                Your {content.type}
              </div>

              <RemovedPostPreview content={content as any} />

              {moderation.reviewed_text &&
                moderation.reviewed_text !== body && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--fs-meta)",
                        color: "var(--text-3)",
                        marginBottom: 4,
                      }}
                    >
                      {/* For an image or a video this is the ONLY human-readable
                          account of what the model actually judged. */}
                      What the review read
                    </div>
                    <div
                      style={{
                        fontSize: "var(--fs-body-sm)",
                        color: "var(--text-2)",
                        lineHeight: 1.5,
                      }}
                    >
                      {moderation.reviewed_text}
                    </div>
                  </div>
                )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default ModerationDetail;
