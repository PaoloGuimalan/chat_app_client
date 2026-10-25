import type { IFlexibleEntity } from "@/reusables/vars/interfaces";

export interface ContributionIdentity {
  entity: IFlexibleEntity | null;
  is_anonymous?: boolean;
  is_owner?: boolean;
}

export function contributionAuthor(contribution: ContributionIdentity) {
  return contribution.is_anonymous ? null : contribution.entity;
}

export function ownsContribution(
  contribution: ContributionIdentity,
  actingEntityId: string,
) {
  if (typeof contribution.is_owner === "boolean") return contribution.is_owner;
  return Boolean(actingEntityId)
    && !contribution.is_anonymous
    && contribution.entity?.id === actingEntityId;
}

export function replyMentionFor(
  contribution: ContributionIdentity,
  actingEntityId: string,
): string | null {
  if (ownsContribution(contribution, actingEntityId)) return null;
  const author = contributionAuthor(contribution);
  return author?.details.username || author?.details.slug || null;
}
