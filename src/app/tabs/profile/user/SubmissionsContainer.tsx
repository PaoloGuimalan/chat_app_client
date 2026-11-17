import { useCallback, useEffect, useRef, useState } from "react";
import "@/app/tabs/realms/tabs/realmReview.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Btn, Card } from "@/reusables/design";
import PostItem from "./PostItem";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { listAuthorSubmissions } from "@/reusables/hooks/communityRequests";
import { DeletePostRequest } from "@/reusables/hooks/requests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import type { CommunitySubmission } from "@/reusables/vars/realmApprovals";

/** Private to the exact acting author, including pages. Server enforces the same boundary. */
export default function SubmissionsContainer({
  ownerEntityId,
}: {
  ownerEntityId: string;
}) {
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
  const identity = `${actor}:${token}:${ownerEntityId}`;
  const current = useRef(identity);
  current.current = identity;
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const scope = `${identity}:${revision}`;
  const [data, setData] = useState<{
    scope: string;
    rows: CommunitySubmission[];
    next: boolean;
    busy: boolean;
    failed: boolean;
  }>({ scope: "", rows: [], next: false, busy: true, failed: false });
  const [withdraw, setWithdraw] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = useCallback(
    () =>
      current.current === identity &&
      token === localStorage.getItem("authtoken"),
    [identity, token],
  );
  const refresh = () => {
    setPage(1);
    setRevision((n) => n + 1);
  };
  useEffect(() => {
    let active = true;
    setWithdraw(null);
    setSaving(false);
    if (actor !== ownerEntityId || !token) return;
    setData((previous) => ({
      scope,
      rows: page > 1 && previous.scope === scope ? previous.rows : [],
      next: false,
      busy: true,
      failed: false,
    }));
    listAuthorSubmissions({ page })
      .then((result) => {
        if (!active || !valid()) return;
        setData((previous) => ({
          scope,
          rows: Array.from(
            new Map(
              [
                ...(page > 1 && previous.scope === scope ? previous.rows : []),
                ...result.results,
              ].map((row) => [row.post.post_id, row]),
            ).values(),
          ),
          next: Boolean(result.next),
          busy: false,
          failed: false,
        }));
      })
      .catch((error) => {
        if (!active || !valid()) return;
        setData({ scope, rows: [], next: false, busy: false, failed: true });
        notifyRequestError(error, "We couldn’t load your submissions.");
      });
    return () => {
      active = false;
    };
  }, [scope, page, actor, ownerEntityId, token, valid]);
  useEffect(() => {
    const changed = () => refresh();
    document.addEventListener("community-posts-changed", changed);
    document.addEventListener("community-changed", changed);
    document.addEventListener("post-stream-reconnected", changed);
    return () => {
      document.removeEventListener("community-posts-changed", changed);
      document.removeEventListener("community-changed", changed);
      document.removeEventListener("post-stream-reconnected", changed);
    };
  }, [identity]);
  if (actor !== ownerEntityId || !token) return null;
  const rows = data.scope === scope ? data.rows : [];
  const busy = data.scope !== scope || data.busy;
  const remove = async () => {
    if (!withdraw || saving) return;
    setSaving(true);
    try {
      const response = await DeletePostRequest([withdraw]);
      if (!valid()) return;
      if (response?.data?.status === false)
        throw new Error(
          response.data.message || "The submission could not be withdrawn.",
        );
      setWithdraw(null);
      refresh();
    } catch (error) {
      if (valid())
        notifyRequestError(error, "We couldn’t withdraw this submission.");
    } finally {
      if (valid()) setSaving(false);
    }
  };
  return (
    <section className="cl-realm-review tw-w-full tw-min-w-0 tw-flex tw-flex-col tw-gap-[12px] tw-text-left">
      <Card>
        <h2 className="tw-m-0 tw-text-left tw-text-[18px]">Submissions</h2>
        <p className="tw-mb-0 tw-text-[var(--text-2)]">
          Only you can see your pending and unapproved community posts here.
        </p>
      </Card>
      {rows.map((row) => (
        <Card key={`${row.post.post_id}:${row.content_version}`} pad={0}>
          <div className="tw-p-[14px] tw-text-left">
            <strong>
              {row.approval === 0 ? "Pending approval" : "Unapproved"}
            </strong>
            {row.decision?.reason && (
              <p className="tw-mb-0 tw-whitespace-pre-wrap">
                {row.decision.reason}
              </p>
            )}
          </div>
          <PostItem
            mp={{ ...row.post, read_only: true, approval: row.approval }}
            isSharePreview
            embedded
            show_archived
          />
          <div className="cl-review-actions tw-p-[14px]">
            {row.decision && row.approval === 2 && (
              <Btn
                variant="ghost"
                onClick={() =>
                  navigate(
                    `/realm-review/${encodeURIComponent(row.decision!.id)}`,
                  )
                }
              >
                View decision
              </Btn>
            )}
            <Btn
              variant="outline"
              disabled={saving}
              onClick={() => setWithdraw(row.post.post_id)}
            >
              Withdraw
            </Btn>
          </div>
        </Card>
      ))}
      {busy && (
        <div role="status" aria-label="Loading submissions">
          <SkeletonTheme
            baseColor="var(--surface-2)"
            highlightColor="var(--surface-hover)"
          >
            <Skeleton count={2} height={150} />
          </SkeletonTheme>
        </div>
      )}
      {!busy && data.failed && (
        <Btn variant="outline" onClick={refresh}>
          Retry
        </Btn>
      )}
      {!busy && !data.failed && !rows.length && (
        <Card>No pending or unapproved submissions.</Card>
      )}
      {!busy && data.next && (
        <Btn variant="outline" onClick={() => setPage((n) => n + 1)}>
          Load more
        </Btn>
      )}
      {withdraw && (
        <ConfirmModal
          title="Withdraw this submission?"
          message="This deletes your submission. You can create a new post later."
          confirmLabel="Withdraw"
          onClose={() => setWithdraw(null)}
          onConfirm={() => void remove()}
          isBusy={saving}
        />
      )}
    </section>
  );
}
