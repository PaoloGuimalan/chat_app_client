import { useEffect, useRef, useState } from "react";
import "./realmReview.css";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { BotFlag, Btn, Card, PageFlag, SegTabs } from "@/reusables/design";
import ReviewReasonModal from "@/app/widgets/modals/ReviewReasonModal";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import PostItem from "@/app/tabs/profile/user/PostItem";
import {
  ContributionAvatar,
  ContributionName,
} from "@/app/reusables/ContributionAuthor";
import { CommunityPostScope } from "@/app/reusables/CommunityPostScope";
import {
  listCommunityApprovals,
  reviewCommunityInvitation,
  reviewCommunityPost,
} from "@/reusables/hooks/communityRequests";
import { notify, notifyRequestError } from "@/reusables/hooks/errormessages";
import type {
  CommunityInvite,
  IRealmProfileInfo,
} from "@/reusables/vars/interfaces";
import type {
  ApprovalKind,
  ApprovalPage,
  CommunitySubmission,
} from "@/reusables/vars/realmApprovals";

type Selection =
  | { kind: "posts"; row: CommunitySubmission; action: "approve" | "reject" }
  | {
      kind: "joins" | "invites";
      row: CommunityInvite;
      action: "approve" | "reject";
    };
export default function Approvals({
  realm,
  initialKind,
  targetId,
}: {
  realm: IRealmProfileInfo;
  initialKind?: ApprovalKind;
  targetId?: string;
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
  const [params] = useSearchParams();
  const sections = [
    ...(realm.capabilities?.can_review_posts
      ? [{ key: "posts", label: "Posts" }]
      : []),
    ...(realm.capabilities?.can_review_invites
      ? [{ key: "invites", label: "Invitations" }]
      : []),
    ...(realm.capabilities?.can_review_join_requests ||
    realm.capabilities?.can_decline_join_requests
      ? [{ key: "joins", label: "Join requests" }]
      : []),
  ];
  const requestedKind = initialKind || params.get("kind") || "posts";
  const [selectedKind, setKind] = useState(requestedKind);
  useEffect(() => {
    setKind(requestedKind);
    setPage(1);
  }, [requestedKind]);
  const kind = (
    sections.some((item) => item.key === selectedKind)
      ? selectedKind
      : sections[0]?.key
  ) as ApprovalKind | undefined;
  const [filter, setFilter] = useState<"pending" | "not_approved">("pending");
  const state = kind === "posts" ? filter : "pending";
  const [page, setPage] = useState(1);
  const [clearedTarget, setClearedTarget] = useState<string | null>(null);
  const requestedTarget = targetId || params.get("target");
  const target =
    kind === requestedKind && requestedTarget !== clearedTarget
      ? requestedTarget
      : null;
  const [revision, setRevision] = useState(0);
  const token = localStorage.getItem("authtoken");
  const scope = `${actor}:${token}:${realm.id}:${kind}:${state}:${target}:${revision}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [loaded, setLoaded] = useState<{
    scope: string;
    data: ApprovalPage | null;
    busy: boolean;
  }>({ scope, data: null, busy: true });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const mutation = useRef(false);
  const data = loaded.scope === scope ? loaded.data : null;
  const busy = loaded.scope !== scope || loaded.busy;
  const refresh = () => {
    setPage(1);
    setRevision((value) => value + 1);
  };
  useEffect(() => {
    let active = true;
    setSelection(null);
    setReason("");
    setSaving(false);
    setLoaded((previous) => ({
      scope,
      data: page > 1 && previous.scope === scope ? previous.data : null,
      busy: true,
    }));
    if (!kind) {
      setLoaded({ scope, data: null, busy: false });
      return;
    }
    listCommunityApprovals(realm.id, {
      kind,
      state,
      page,
      ...(target ? { target_id: target } : {}),
    })
      .then((result) => {
        if (
          !active ||
          currentScope.current !== scope ||
          token !== localStorage.getItem("authtoken")
        )
          return;
        setLoaded((previous) => ({
          scope,
          busy: false,
          data: {
            ...result,
            results:
              page > 1 && previous.scope === scope
                ? [
                    ...new Map(
                      [
                        ...(previous.data?.results ?? []),
                        ...result.results,
                      ].map((row) => [
                        "post" in row ? row.post.post_id : row.id,
                        row,
                      ]),
                    ).values(),
                  ]
                : result.results,
          },
        }));
      })
      .catch((error) => {
        if (!active || currentScope.current !== scope) return;
        setLoaded({ scope, data: null, busy: false });
        notifyRequestError(error, "We couldn’t load these approvals.");
      });
    return () => {
      active = false;
    };
  }, [scope, page, kind, realm.id, state, target, token]);
  useEffect(() => {
    const changed = (event: Event) => {
      const id = (event as CustomEvent).detail?.realm_id;
      if (!id || [realm.id, realm.realm_id].includes(String(id))) refresh();
    };
    document.addEventListener("community-changed", changed);
    document.addEventListener("reload-realm-members", changed);
    return () => {
      document.removeEventListener("community-changed", changed);
      document.removeEventListener("reload-realm-members", changed);
    };
  }, [realm.id, realm.realm_id]);
  const choose = (value: Selection) => {
    if (!mutation.current) {
      setSelection(value);
      setReason("");
    }
  };
  const decide = async () => {
    if (
      !selection ||
      mutation.current ||
      (selection.kind === "posts" &&
        selection.action === "reject" &&
        !reason.trim())
    )
      return;
    mutation.current = true;
    setSaving(true);
    const captured = selection;
    const current = () =>
      currentScope.current === scope &&
      token === localStorage.getItem("authtoken");
    try {
      if (captured.kind === "posts")
        await reviewCommunityPost(realm.id, captured.row.post.post_id, {
          action: captured.action,
          expected_approval: captured.row.approval,
          expected_version: captured.row.content_version,
          reason: reason.trim(),
        });
      else
        await reviewCommunityInvitation(
          realm.id,
          captured.kind,
          captured.row.id,
          captured.action,
          captured.kind === "invites" ? "for_approval" : "pending",
        );
      if (!current()) return;
      setSelection(null);
      notify(
        "success",
        captured.action === "approve" ? "Approved." : "Not approved.",
      );
      refresh();
      document.dispatchEvent(
        new CustomEvent("reload-realm-members", {
          detail: { realm_id: realm.id },
        }),
      );
    } catch (error) {
      if (!current()) return;
      notifyRequestError(error, "We couldn’t review this item.");
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if ([401, 403, 404, 409].includes(status ?? 0)) {
        setSelection(null);
        refresh();
      }
    } finally {
      mutation.current = false;
      if (current()) setSaving(false);
    }
  };
  return (
    <section className="cl-realm-review tw-w-full tw-min-w-0 tw-p-[16px] md:tw-p-[20px] tw-text-left">
      <h2 className="tw-mt-0 tw-mb-[6px] tw-text-left tw-text-[20px] tw-font-semibold">
        Approvals
      </h2>
      <p className="tw-mt-0 tw-text-[13px] tw-text-[var(--text-2)]">
        Review posts, invitations and requests that need your approval.
      </p>
      <div className="cl-review-filters tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-[10px] tw-mb-[16px]">
        <SegTabs
          tabs={sections.map((item) => ({
            ...item,
            label: `${item.label}${data?.counts[item.key as ApprovalKind] != null ? ` (${data.counts[item.key as ApprovalKind]})` : ""}`,
          }))}
          value={kind ?? ""}
          onChange={(key) => {
            setKind(key);
            setPage(1);
          }}
        />
        {kind === "posts" && (
          <SegTabs
            tabs={[
              { key: "pending", label: "Pending" },
              { key: "not_approved", label: "Not approved" },
            ]}
            value={filter}
            onChange={(key) => {
              setFilter(key as typeof filter);
              setPage(1);
            }}
          />
        )}
      </div>
      {target && (
        <div className="tw-mb-[12px]">
          <Btn
            variant="ghost"
            onClick={() => {
              setClearedTarget(target);
              setPage(1);
            }}
          >
            Show all approvals
          </Btn>
        </div>
      )}
      {!kind ? (
        <Card>You don’t have access to any approval sections.</Card>
      ) : busy && !data ? (
        <div role="status" aria-label="Loading approvals">
          <SkeletonTheme
            baseColor="var(--surface-2)"
            highlightColor="var(--surface-hover)"
          >
            <Skeleton count={3} height={150} />
          </SkeletonTheme>
        </div>
      ) : !data ? (
        <Btn variant="outline" onClick={refresh}>
          Retry
        </Btn>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-[14px]">
          {data.results.length === 0 && (
            <Card>
              No {state === "pending" ? "pending" : "unapproved"}{" "}
              {kind === "posts"
                ? "posts"
                : kind === "joins"
                  ? "join requests"
                  : "invitations"}
              .
            </Card>
          )}
          {data.results.map((item) => {
            if ("post" in item) {
              const selfRestricted =
                item.post.is_owner && !realm.capabilities?.can_publish_posts;
              return (
                <Card
                  key={`${item.post.post_id}:${item.content_version}:${item.approval}`}
                  pad={0}
                >
                  <div className="tw-px-[18px] tw-pt-[14px] tw-text-[12px] tw-font-semibold tw-text-[var(--text-2)]">
                    {item.approval === 0 ? "Pending approval" : "Not approved"}
                  </div>
                  <CommunityPostScope.Provider value={realm.entity}>
                    <PostItem
                      mp={{
                        ...item.post,
                        approval: item.approval,
                        read_only: true,
                      }}
                      isSharePreview
                      embedded
                    />
                  </CommunityPostScope.Provider>
                  {item.decision?.reason && (
                    <p className="tw-mx-[18px] tw-text-[13px]">
                      <strong>Reason: </strong>
                      {item.decision.reason}
                    </p>
                  )}
                  <div className="cl-review-actions tw-p-[16px]">
                    {selfRestricted ? (
                      <span className="tw-text-[13px] tw-text-[var(--text-2)]">
                        Another reviewer must review this submission.
                      </span>
                    ) : (
                      <>
                        {item.approval === 0 && (
                          <Btn
                            variant="outline"
                            disabled={saving}
                            onClick={() =>
                              choose({
                                kind: "posts",
                                row: item,
                                action: "reject",
                              })
                            }
                          >
                            Reject post
                          </Btn>
                        )}
                        <Btn
                          disabled={saving}
                          onClick={() =>
                            choose({
                              kind: "posts",
                              row: item,
                              action: "approve",
                            })
                          }
                        >
                          Approve post
                        </Btn>
                      </>
                    )}
                  </div>
                </Card>
              );
            }
            const entity = item.target_entity;
            const inviteKind = kind === "joins" ? "joins" : "invites";
            return (
              <Card key={item.id}>
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-[12px]">
                  {entity && <ContributionAvatar entity={entity} size={34} />}
                  <div className="tw-flex-1 tw-min-w-[130px] tw-text-left">
                    <span className="tw-inline-flex tw-items-center tw-gap-[4px] tw-font-semibold">
                      <ContributionName entity={entity ?? null} />
                      {entity?.type === "realm" && (
                        <PageFlag realmType={entity.details.type} />
                      )}
                      {entity?.type === "bot" && <BotFlag type="bot" />}
                    </span>
                    <div className="tw-text-[12px] tw-text-[var(--text-2)]">
                      {kind === "joins"
                        ? "Wants to join the community"
                        : `Invitation${item.role_name ? ` · ${item.role_name}` : ""}`}
                    </div>
                    {!entity && item.target_email && (
                      <span className="tw-text-[12px]">
                        {item.target_email}
                      </span>
                    )}
                  </div>
                  <div className="cl-review-actions">
                    {(kind !== "joins" ||
                      realm.capabilities?.can_decline_join_requests) && (
                      <Btn
                        variant="outline"
                        disabled={saving}
                        onClick={() =>
                          choose({
                            kind: inviteKind,
                            row: item,
                            action: "reject",
                          })
                        }
                      >
                        Decline
                      </Btn>
                    )}
                    {(kind !== "joins" ||
                      realm.capabilities?.can_review_join_requests) && (
                      <Btn
                        disabled={saving}
                        onClick={() =>
                          choose({
                            kind: inviteKind,
                            row: item,
                            action: "approve",
                          })
                        }
                      >
                        Approve
                      </Btn>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {data.next && (
            <Btn
              variant="outline"
              disabled={busy}
              onClick={() => setPage((value) => value + 1)}
            >
              {busy ? "Loading…" : "Load more"}
            </Btn>
          )}
        </div>
      )}
      {selection?.kind === "posts" && selection.action === "reject" ? (
        <ReviewReasonModal
          title="Reject post"
          confirmLabel="Reject submission"
          reason={reason}
          busy={saving}
          onReasonChange={setReason}
          onConfirm={() => void decide()}
          onClose={() => setSelection(null)}
        />
      ) : (
        selection && (
          <ConfirmModal
            title={
              selection.action === "approve"
                ? "Approve this item?"
                : "Decline this item?"
            }
            message={
              selection.kind === "posts"
                ? "Approve this version for the community?"
                : selection.kind === "invites" && selection.action === "approve"
                  ? "Approval sends the invitation. The recipient still needs to accept."
                  : "Update this request?"
            }
            confirmLabel={
              selection.action === "approve" ? "Approve" : "Decline"
            }
            onConfirm={() => void decide()}
            onClose={() => setSelection(null)}
            isBusy={saving}
          />
        )
      )}
    </section>
  );
}
