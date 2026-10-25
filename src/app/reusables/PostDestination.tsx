import type { IPost } from "@/reusables/vars/interfaces";
import { useNavigate } from "react-router-dom";
import TaggingSummary from "./TaggingSummary";
import CommunityName from "./CommunityName";

/** Destination tags are displayed separately from ordinary people/page tags. */
export default function PostDestination({ post }: { post: Pick<IPost, "tagging" | "community"> }) {
  const navigate = useNavigate();
  const community = post.community;
  const tagging = community
    ? post.tagging.filter(tag => tag.entity.id !== community.entity_id && tag.entity.details.type !== "community")
    : post.tagging;
  return (
    <>
      <TaggingSummary tagging={tagging} />
      {community && (
        <span className="cl-text-body">
          {tagging.length ? " · " : ""}posted in{" "}
          <span className="cl-feed-card__title tw-font-semibold tw-cursor-pointer" onClick={() => navigate(`/communities/${encodeURIComponent(community.slug || community.realm_id)}`)}><CommunityName community={community} /></span>
        </span>
      )}
    </>
  );
}
