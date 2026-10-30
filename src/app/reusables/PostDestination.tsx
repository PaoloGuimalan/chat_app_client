import type { IPost } from "@/reusables/vars/interfaces";
import { useNavigate } from "react-router-dom";
import TaggingSummary from "./TaggingSummary";
import CommunityName from "./CommunityName";
import { communityProfilePath } from "@/reusables/routing/communityPaths";
import { useContext } from "react";
import { CommunityPostScope } from "./CommunityPostScope";

/** Destination tags are displayed separately from ordinary people/page tags. */
export default function PostDestination({ post }: { post: Pick<IPost, "tagging" | "community"> & Partial<Pick<IPost, "entity">> }) {
  const navigate = useNavigate();
  const community = post.community;
  const scope = useContext(CommunityPostScope);
  const showDestination = community && scope !== community.entity_id &&
    post.entity?.id !== community.entity_id;
  const tagging = post.tagging.filter(tag =>
    tag.entity.id !== community?.entity_id && tag.entity.details.type !== "community");
  return (
    <>
      <TaggingSummary tagging={tagging} />
      {showDestination && (
        <span className="cl-text-body">
          {tagging.length ? "\u00a0" : ""}posted in{" "}
          <a
            className="cl-community-destination-link"
            href={communityProfilePath(community)}
            onClick={event => {
              event.stopPropagation();
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              navigate(communityProfilePath(community));
            }}
          >
            <CommunityName community={community} compact />
          </a>
        </span>
      )}
    </>
  );
}
