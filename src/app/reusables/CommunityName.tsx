import type { ICommunityMetadata } from "@/reusables/vars/interfaces";
import { Icon } from "@/reusables/design";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import "@/styles/community-name.css";

/** Shared name and markers for community destinations, lists and profiles. */
export default function CommunityName({
  community,
  compact = false,
}: {
  community: Pick<ICommunityMetadata, "name" | "is_verified">;
  compact?: boolean;
}) {
  return (
    <span className={`cl-community-name${compact ? " cl-community-name--compact" : ""}`}>
      <span>{community.name}</span>
      {community.is_verified && (
        <span role="img" aria-label="Verified community" title="Verified community">
          <RiVerifiedBadgeFill size={14} color="var(--brand)" aria-hidden="true"/>
        </span>
      )}
      <span role="img" aria-label="Community" title="Community">
        <Icon n="groups" s={20} c="var(--text-3)" />
      </span>
    </span>
  );
}
