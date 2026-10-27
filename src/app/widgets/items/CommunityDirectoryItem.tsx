import { Avatar } from "@/reusables/design";
import CommunityName from "@/app/reusables/CommunityName";
import type { CommunityCard } from "@/reusables/hooks/communityRequests";

/** Community navigation using the same display-card layout as other realms. */
export default function CommunityDirectoryItem({
  community,
  onOpen,
  onJoin,
  busy = false,
}: {
  community: CommunityCard;
  onOpen: () => void;
  onJoin?: () => void;
  busy?: boolean;
}) {
  const cover = community.cover_photo;
  const status = community.is_member
    ? "Joined"
    : community.request_pending
      ? "Cancel request"
      : community.is_private
        ? "Request to join"
        : "Join community";
  const statusStyle =
    community.is_member || community.request_pending
      ? "cl-display-card__button--muted"
      : "cl-display-card__button--primary";
  return (
    <article className="cl-display-card cl-community-card">
      <button
        type="button"
        aria-label={`Open ${community.name}`}
        onClick={onOpen}
        className="cl-display-card__cover cl-community-card-cover tw-w-full tw-p-0 tw-border-0"
      >
        {cover && cover !== "none" && (
          <img src={cover} alt="" className="cl-community-cover-image" />
        )}
      </button>
      <div className="cl-display-card__body cl-community-card-body">
        <div className="cl-display-card__avatar-shell tw-relative tw--mt-[30px] tw-flex tw-items-center tw-justify-center">
          <Avatar
            id={community.entity_id}
            name={community.name}
            src={community.profile !== "none" ? community.profile : undefined}
            size={40}
            shape="rounded"
          />
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="cl-display-card__title cl-text-body tw-font-semibold tw-bg-transparent tw-border-0 tw-p-0 tw-text-left tw-text-[var(--text)]"
        >
          <CommunityName community={community} />
        </button>
        <span className="cl-display-card__description cl-community-card-description cl-text-caption">
          {community.description || "A place to connect and share."}
        </span>
        <div className="cl-community-card-footer">
          <span className="cl-display-card__meta cl-text-caption">
            {community.is_private ? "Private" : "Public"} ·{" "}
            {community.member_count ?? "—"} members
          </span>
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={community.is_member ? onOpen : (onJoin ?? onOpen)}
            className={`cl-community-chip cl-display-card__button ${statusStyle}`}
          >
            {busy ? "Updating…" : status}
          </button>
        </div>
      </div>
    </article>
  );
}
