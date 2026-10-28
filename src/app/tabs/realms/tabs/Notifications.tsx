import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { AnonymousAvatar } from "@/app/reusables/ContributionAuthor";
import { Avatar, BotFlag, Btn, Card, Icon, PageFlag } from "@/reusables/design";
import {
  listCommunityNotifications,
  acknowledgeCommunityNotifications,
  type CommunityNotification,
} from "@/reusables/hooks/communityRequests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import { timeSince } from "@/reusables/hooks/reusable";
import type { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import "@/styles/community-notifications.css";

const FAILED = "Community notifications could not be loaded. Please try again.";
const supportedTypes = new Set([
  "community_join_request", "community_member_joined", "community_post_created",
  "post_comment", "post_reaction", "comment_reaction",
]);
const statuses = {
  pending: "Pending", accepted: "Approved", declined: "Declined", revoked: "Withdrawn",
};

export default function Notifications({
  realm,
  onReviewRequests,
  onOpenPost,
}: {
  realm: IRealmProfileInfo;
  onReviewRequests?: () => void;
  onOpenPost?: () => void;
}) {
  const navigate = useNavigate();
  const actor = useSelector((state: {
    authentication: { active_entity_context?: { id?: string; }; user: { entity_id: string; }; };
  }) => state.authentication.active_entity_context?.id ?? state.authentication.user.entity_id);
  const realmId = realm.realm_id;
  const [revision, setRevision] = useState(0);
  const identity = `${actor}:${realmId}`;
  const [pagination, setPagination] = useState({ identity, page: 1 });
  const page = pagination.identity === identity ? pagination.page : 1;
  const [attempt, setAttempt] = useState(0);
  const scope = `${actor}:${realmId}:${revision}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [activity, setActivity] = useState<{
    scope: string;
    rows: CommunityNotification[];
    next: number | null;
    busy: boolean;
    error: boolean;
  }>({ scope, rows: [], next: null, busy: true, error: false });
  const visible = activity.scope === scope;
  const rows = visible ? activity.rows : [];
  const busy = !visible || activity.busy;
  const error = visible && activity.error;

  useEffect(() => {
    let active = true;
    setActivity(previous => ({
      scope,
      rows: previous.scope === scope ? previous.rows : [],
      next: previous.scope === scope ? previous.next : null,
      busy: true,
      error: false,
    }));
    listCommunityNotifications(realmId, { page })
      .then(result => {
        if (!active || currentScope.current !== scope) return;
        // Read only the page number: every authenticated request stays on
        // our configured first-party endpoint, never a returned next URL.
        const nextPage = result.next
          ? Number(new URL(result.next, "https://pagination.invalid").searchParams.get("page"))
          : 0;
        setActivity(previous => ({
          scope,
          rows: Array.from(new Map([
            ...(page > 1 && previous.scope === scope ? previous.rows : []),
            ...result.results.filter(row => supportedTypes.has(row.type)),
          ].map(row => [row.id, row])).values()),
          next: Number.isInteger(nextPage) && nextPage > page ? nextPage : null,
          busy: false,
          error: false,
        }));
        if (Number.isInteger(result.activity_revision)) {
          // Acknowledge only the rows displayed on this page. Later arrivals
          // and rows not loaded yet remain unread for this administrator.
          void acknowledgeCommunityNotifications(realmId, result.activity_revision,
            result.results.filter(row => supportedTypes.has(row.type)).map(row => row.id))
            .catch(failure => {
              if (active && currentScope.current === scope)
                notifyRequestError(failure, "We couldn't mark community activity as read.");
            });
        }
      })
      .catch(failure => {
        if (!active || currentScope.current !== scope) return;
        const revoked = [401, 403, 404].includes(failure?.response?.status);
        setActivity(previous => ({ ...previous, ...(revoked ? { rows: [], next: null } : {}), busy: false, error: true }));
        notifyRequestError(failure, FAILED);
      });
    return () => { active = false; };
  }, [realmId, scope, page, attempt]);

  useEffect(() => {
    const changed = (event: Event) => {
      const id = (event as CustomEvent).detail?.realm_id;
      if (id && String(id) !== realmId && String(id) !== realm.id) return;
      setPagination({ identity, page: 1 });
      setRevision(value => value + 1);
    };
    document.addEventListener("community-changed", changed);
    document.addEventListener("reload-realm-members", changed);
    return () => {
      document.removeEventListener("community-changed", changed);
      document.removeEventListener("reload-realm-members", changed);
    };
  }, [realmId, realm.id, identity]);

  return (
    <section className="cl-community-notifications" aria-label="Community notifications">
      <header className="cl-community-notifications__heading">
        <h1>Notifications</h1>
        <p>Join requests, members, posts and community activity.</p>
      </header>
      <Card pad={0} className="cl-community-notifications__list">
        {rows.map(row => {
          // Never pass an anonymous entity to Avatar: it resolves identities
          // and cached photos from either id as well as from src.
          const entity = row.is_anonymous ? null : row.actor;
          const details = entity?.details ?? {};
          const name = row.is_anonymous ? "Anonymous member" : (
            [details.first_name, details.last_name].filter(Boolean).join(" ").trim()
            || details.name || details.username || "Someone"
          );
          const isRequest = row.type === "community_join_request";
          const verified = entity?.type === "user"
            ? details.is_badged === true
            : details.is_verified === true || details.is_badged === true;
          const subject = row.is_anonymous ? "An anonymous member" : name;
          const description = row.description.startsWith(subject)
            ? row.description.slice(subject.length)
            : null;
          const date = new Date(row.created_at);
          const validDate = !Number.isNaN(date.getTime());
          return (
            <article key={row.id} className="cl-community-notifications__row">
              {row.is_anonymous ? <AnonymousAvatar size={40} /> : <Avatar
                id={entity ? details.username || details.slug : undefined}
                entityId={entity?.id}
                name={name}
                kind={entity?.type}
                src={details.profile && !["none", "N/A"].includes(details.profile) ? details.profile : undefined}
                size={40}
              />}
              <div className="cl-community-notifications__content">
                <p>
                  {description === null ? row.description : <>
                    <strong className="cl-community-notifications__subject">
                      <span>{subject}</span>
                      {entity && verified && (
                        <Icon n="verified" s={14} c="var(--brand)" />
                      )}
                      {entity?.type === "realm" && (
                        details.type === "community"
                          ? <Icon n="groups" s={18} c="var(--text-3)" />
                          : <PageFlag realmType={details.type} size={13} />
                      )}
                      <BotFlag type={entity?.type} size={13} />
                    </strong>
                    {description}
                  </>}
                </p>
                <div className="cl-community-notifications__meta">
                  <Icon n={isRequest || row.type === "community_member_joined"
                    ? "person_add" : row.type === "community_post_created" ? "article"
                      : row.type === "post_comment" ? "chat_bubble_outline" : "favorite_border"} s={14} />
                  {validDate && <time dateTime={row.created_at} title={date.toLocaleString()}>{timeSince(date)}</time>}
                  {isRequest && <span className="cl-community-notifications__status">{row.request_status ? statuses[row.request_status] : "Request unavailable"}</span>}
                </div>
                {isRequest && row.request_status === "pending" && row.request_id && (
                  <Btn size="sm" variant="soft" onClick={() => onReviewRequests
                    ? onReviewRequests()
                    : navigate(`/realms/${encodeURIComponent(realm.id)}/members`)}>
                    Review request
                  </Btn>
                )}
                {!isRequest && row.post_id && (
                  <Btn size="sm" variant="ghost" onClick={() => {
                    navigate(`/post/${encodeURIComponent(row.post_id!)}${row.anchor ? `?anchor=${encodeURIComponent(row.anchor)}` : ""}`);
                    onOpenPost?.();
                  }}>View post</Btn>
                )}
              </div>
            </article>
          );
        })}
        {busy && (
          <div role="status" aria-label="Loading notifications" className="cl-community-notifications__loading">
            <SkeletonTheme baseColor="var(--skeleton)" highlightColor="var(--skeleton-shine)">
              {[0, 1, 2].map(index => <div key={index} className="cl-community-notifications__row" aria-hidden="true">
                <Skeleton circle width={40} height={40} />
                <div className="cl-community-notifications__content"><Skeleton width="85%" /><Skeleton width="45%" /></div>
              </div>)}
            </SkeletonTheme>
          </div>
        )}
        {!busy && error && (
          <div className="cl-community-notifications__notice" role="alert">
            <p>{FAILED}</p>
            <Btn variant="outline" onClick={() => setAttempt(value => value + 1)}>Try again</Btn>
          </div>
        )}
        {!busy && !error && rows.length === 0 && (
          <div className="cl-community-notifications__notice">
            <Icon n="notifications_none" s={32} c="var(--text-3)" />
            <h2>No notifications yet</h2>
            <p>Join requests, new members, posts and activity on your community’s own posts will appear here.</p>
          </div>
        )}
      </Card>
      {!busy && !error && visible && activity.next && (
        <Btn variant="outline" onClick={() => setPagination({ identity, page: activity.next! })}>Load more</Btn>
      )}
    </section>
  );
}
