import type { IFlexibleEntity } from "@/reusables/vars/interfaces";
import { Avatar } from "@/reusables/design";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import CommunityName from "./CommunityName";

export function AnonymousAvatar({ size = 35 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="Anonymous member"
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "var(--surface-2)",
        color: "var(--text-2)",
      }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" fill="currentColor"/>
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" fill="currentColor"/>
      </svg>
    </span>
  );
}

export function ContributionAvatar({
  entity,
  size = 35,
}: {
  entity: IFlexibleEntity | null;
  size?: number;
}) {
  if (!entity) return <AnonymousAvatar size={size}/>;
  const details = entity.details;
  return (
    <Avatar
      id={details.slug || details.username || details.id}
      entityId={entity.id}
      name={details.name || `${details.first_name} ${details.last_name}`}
      src={details.profile && !["none", "N/A"].includes(details.profile)
        ? details.profile
        : undefined}
      kind={entity.type}
      size={size}
    />
  );
}

export function ContributionName({ entity }: { entity: IFlexibleEntity | null }) {
  if (!entity) return <>Anonymous member</>;
  const details = entity.details;
  if (entity.type === "realm" && details.type === "community") {
    return (
      <CommunityName
        community={{ name: details.name || "Community", is_verified: details.is_verified }}
        compact
      />
    );
  }
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-[4px] tw-align-baseline">
      <span>
        {entity.type === "user" ? (
          <>
            {details.first_name}
            {details.middle_name && details.middle_name !== "N/A" ? ` ${details.middle_name}` : ""}{" "}
            {details.last_name}
          </>
        ) : details.name}
      </span>
      {(entity.type === "user" ? details.is_badged : details.is_verified) && (
        <RiVerifiedBadgeFill size={16} color="var(--brand)" className="tw-shrink-0"/>
      )}
    </span>
  );
}
