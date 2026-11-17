import type { ICommunityMetadata } from "../vars/interfaces";
export const canReadCommunity = (community: Pick<ICommunityMetadata, "is_private" | "is_member">) => !community.is_private || community.is_member;
export const canContributeCommunity = (community: Pick<ICommunityMetadata, "is_member" | "capabilities">) => community.is_member === true && community.capabilities?.can_submit_posts !== false;
export const selectedCommunity = <T extends Pick<ICommunityMetadata, "entity_id" | "is_member" | "capabilities">>(communities: T[], id: string): T | null => communities.find(community => community.entity_id === id && canContributeCommunity(community)) ?? null;
export const reactionIdentity = (choice?: boolean) => typeof choice === "boolean" ? choice : undefined;
export const canReviewCommunityRequests = (role?: string | null) => ["owner", "admin", "moderator"].includes(role || "");
export const canManageCommunitySettings = (role?: string | null) => ["owner", "admin"].includes(role || "");

export const postPublicationMessage = (approval?: number) => approval === 0 ? "Your post was submitted for approval. View it under Submissions on your profile." : "Your post has been saved";
