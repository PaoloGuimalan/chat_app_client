import type { ICommunityMetadata } from "../vars/interfaces";
export const canReadCommunity = (community: Pick<ICommunityMetadata, "is_private" | "is_member">) => !community.is_private || community.is_member;
export const canContributeCommunity = (community: Pick<ICommunityMetadata, "is_member">) => community.is_member === true;
export const selectedCommunity = <T extends Pick<ICommunityMetadata, "entity_id" | "is_member">>(communities: T[], id: string): T | null => communities.find(community => community.entity_id === id && community.is_member) ?? null;
export const reactionIdentity = (choice?: boolean) => typeof choice === "boolean" ? choice : undefined;
export const canReviewCommunityRequests = (role?: string | null) => ["owner", "admin", "moderator"].includes(role || "");
export const canManageCommunitySettings = (role?: string | null) => ["owner", "admin"].includes(role || "");
