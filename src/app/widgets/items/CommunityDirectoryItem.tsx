import { Avatar } from "@/reusables/design";
import CommunityName from "@/app/reusables/CommunityName";
import type { CommunityCard } from "@/reusables/hooks/communityRequests";

/** Community navigation using the same display-card layout as other realms. */
export default function CommunityDirectoryItem({
  community,
  onOpen,
}: {
  community: CommunityCard;
  onOpen: () => void;
}) {
  const cover = community.cover_photo;
  const status = community.is_member
    ? "Joined"
    : community.request_pending ? "Request pending"
      : community.is_private ? "Request to join" : "View community";
  const statusStyle = community.is_member || community.request_pending
    ? "cl-display-card__button--muted"
    : "cl-display-card__button--primary";
  return (
    <button type="button" className="cl-display-card cl-community-card" onClick={onOpen}>
      <div className="cl-display-card__cover cl-community-card-cover">
        {cover && cover !== "none" && (
          <img src={cover} alt="" className="cl-community-cover-image" />
        )}
      </div>
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
        <span className="cl-display-card__title cl-text-body tw-font-semibold">
          <CommunityName community={community} />
        </span>
        <span className="cl-display-card__description cl-community-card-description cl-text-caption">
          {community.description || "A place to connect and share."}
        </span>
        <div className="cl-community-card-footer">
          <span className="cl-display-card__meta cl-text-caption">
            {community.is_private ? "Private" : "Public"} · {community.member_count ?? "—"} members
          </span>
          <span className={`cl-community-chip cl-display-card__button ${statusStyle}`}>
            {status}
          </span>
        </div>
      </div>
    </button>
  );
}
