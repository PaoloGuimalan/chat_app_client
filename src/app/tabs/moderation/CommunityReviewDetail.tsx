import { useEffect, useRef, useState } from "react";
import "@/app/tabs/realms/tabs/realmReview.css";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Btn, Card } from "@/reusables/design";
import PostItem from "@/app/tabs/profile/user/PostItem";
import { getRealmReviewDecision } from "@/reusables/hooks/communityRequests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import type { RealmReviewDetail } from "@/reusables/vars/realmApprovals";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

/** Human moderation uses the existing card/post presentation, with no fabricated AI data. */
export default function CommunityReviewDetail() {
  const { decisionId } = useParams();
  const actor = useSelector(
    (s: {
      authentication: {
        active_entity_context?: { id?: string };
        user: { entity_id: string };
      };
    }) =>
      s.authentication.active_entity_context?.id ??
      s.authentication.user.entity_id,
  );
  const token = localStorage.getItem("authtoken");
  const scope = `${actor}:${token}:${decisionId}`;
  const current = useRef(scope);
  current.current = scope;
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{
    scope: string;
    detail: RealmReviewDetail | null;
    busy: boolean;
  }>({ scope: "", detail: null, busy: true });
  useEffect(() => {
    let active = true;
    setLoaded({ scope, detail: null, busy: true });
    if (!decisionId) {
      setLoaded({ scope, detail: null, busy: false });
      return;
    }
    getRealmReviewDecision(decisionId)
      .then((detail) => {
        if (
          active &&
          current.current === scope &&
          token === localStorage.getItem("authtoken")
        )
          setLoaded({ scope, detail, busy: false });
      })
      .catch((error) => {
        if (!active || current.current !== scope) return;
        setLoaded({ scope, detail: null, busy: false });
        notifyRequestError(error, "This community decision is unavailable.");
      });
    return () => {
      active = false;
    };
  }, [scope, revision, decisionId, token]);
  const detail = loaded.scope === scope ? loaded.detail : null;
  const busy = loaded.scope !== scope || loaded.busy;
  return (
    <section className="cl-realm-review tw-w-full tw-min-w-0 tw-max-w-[960px] tw-mx-auto tw-p-[16px] tw-flex tw-flex-col tw-gap-[16px] tw-text-left">
      <Card>
        <h1 className="tw-mt-0 tw-text-left tw-text-[22px]">
          Community decision
        </h1>
        {busy ? (
          <SkeletonTheme
            baseColor="var(--surface-2)"
            highlightColor="var(--surface-hover)"
          >
            <Skeleton count={3} />
          </SkeletonTheme>
        ) : detail ? (
          <>
            <h2 className="tw-text-left tw-text-[18px]">
              {detail.decision.action === "takedown"
                ? "Post taken down"
                : detail.decision.action === "reject"
                  ? "Post not approved"
                  : "Post approved"}
            </h2>
            <p className="tw-whitespace-pre-wrap tw-mb-[8px]">
              {detail.decision.reason || "No explanation was provided."}
            </p>
            {detail.decision.created_at && (
              <time className="tw-block tw-text-[12px] tw-text-[var(--text-2)]">
                {new Date(detail.decision.created_at).toLocaleString()}
              </time>
            )}
          </>
        ) : (
          <>
            <p>This decision is unavailable.</p>
            <Btn variant="outline" onClick={() => setRevision((n) => n + 1)}>
              Retry
            </Btn>
          </>
        )}
      </Card>
      {detail &&
        (detail.content ? (
          <>
            {!detail.matches_reviewed_version && (
              <Card>
                This is the current retained content; it may differ from what
                was reviewed.
              </Card>
            )}
            <Card pad={0}>
              <PostItem
                mp={{ ...detail.content, read_only: true }}
                isSharePreview
                embedded
                show_archived
              />
            </Card>
          </>
        ) : (
          <Card>The post is no longer available.</Card>
        ))}
    </section>
  );
}
