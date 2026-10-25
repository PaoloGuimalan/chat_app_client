import type { ICommunityMetadata } from "@/reusables/vars/interfaces";
import { Icon } from "@/reusables/design";
import { RiVerifiedBadgeFill } from "react-icons/ri";

/** Shared name and markers for community destinations, lists and profiles. */
export default function CommunityName({
  community,
}: {
  community: Pick<ICommunityMetadata, "name" | "is_verified">;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-align-middle">
      <span>{community.name}</span>
      {community.is_verified && (
        <span role="img" aria-label="Verified community" title="Verified community">
          <RiVerifiedBadgeFill size={14} color="var(--brand)" aria-hidden="true"/>
        </span>
      )}
      <span role="img" aria-label="Community" title="Community">
        <Icon n="groups" s={18} c="var(--text-3)"/>
      </span>
    </span>
  );
}
