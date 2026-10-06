/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreateRealmInviteRequest } from "@/reusables/hooks/requests";
/**
 * Realm invites on the web - the shapes the Django invite API returns
 * (community/serializers.py InviteSerializer) and the few rules the screens
 * share. The server decides what an invite may be; see
 * user_service/community/invite_rules.py.
 */

export type InvitableRealmType = "group" | "server" | "conference" | "page";
export type InvitePurpose = "join" | "manage" | "follow";

export interface IInviteEntity {
  id: string;
  type: "user" | "realm" | "bot";
  details: any;
}

export interface IRealmInvite {
  id: string;
  realm_id: string;
  realm_name: string;
  realm_type: string;
  realm_slug: string | null;
  realm_profile: string | null;
  kind: "invite" | "request";
  status: "pending" | "accepted" | "declined" | "revoked";
  purpose: InvitePurpose;
  role: "admin" | "moderator" | null;
  inviter: IInviteEntity | null;
  target_email: string | null;
  target_entity: IInviteEntity | null;
  invite_token: string;
  created_at: string;
}

const usable = (src?: string | null) =>
  src && src !== "none" && src !== "N/A" ? src : undefined;

/** A display name and picture for a serialized entity. */
export const entityDisplay = (entity: IInviteEntity | null | undefined) => {
  const d = entity?.details ?? {};
  const name =
    [d.first_name, d.last_name].filter(Boolean).join(" ").trim() ||
    d.name ||
    d.username ||
    d.slug ||
    "Someone";
  return {
    name,
    handle: d.username || d.slug || null,
    profile: usable(d.profile),
  };
};

/** Mirrors invite_sentence on the server. */
export const inviteSentence = (invite: IRealmInvite) => {
  const inviter = entityDisplay(invite.inviter).name;
  const realm = invite.realm_name;
  if (invite.purpose === "manage") {
    return `${inviter} invited you to help run ${realm} as ${
      invite.role === "admin" ? "an admin" : "a moderator"
    }.`;
  }
  if (invite.purpose === "follow") {
    return `${inviter} invited you to follow ${realm}.`;
  }
  const noun =
    invite.realm_type === "group"
      ? "the group "
      : invite.realm_type === "server"
        ? "the server "
        : invite.realm_type === "conference"
          ? "the conference "
          : "";
  return `${inviter} invited you to join ${noun}${realm}.`;
};

/** Where an ACCEPTED invite takes you. */
export const inviteDestination = (invite: IRealmInvite): string | null => {
  switch (invite.realm_type) {
    case "group":
      return `/messages/${invite.realm_id}`;
    case "server":
      return `/servers/${invite.realm_id}`;
    case "conference":
      return invite.realm_slug ? `/conference/${invite.realm_slug}` : null;
    case "page":
      // Following lands on the page itself; joining its team, on the screen
      // the team runs it from.
      if (!invite.realm_slug) return null;
      return invite.purpose === "manage"
        ? `/realms/${invite.realm_slug}`
        : `/${invite.realm_slug}`;
    default:
      return null;
  }
};

/**
 * A conference invite's way in: the conference's own lobby, carrying the
 * token. The lobby shows the invite, takes the answer and lets you join -
 * guests included - so this is where a conference invite should lead.
 */
export const conferenceLink = (invite: IRealmInvite): string | null =>
  invite.realm_type === "conference" && invite.realm_slug
    ? `/conference/${invite.realm_slug}?invite_token=${encodeURIComponent(
        invite.invite_token,
      )}`
    : null;

/** "to follow" / "as an admin" - what a pending invite is for, in a list. */
export const invitePurposeLabel = (invite: IRealmInvite) =>
  invite.purpose === "follow"
    ? "to follow"
    : invite.purpose === "manage"
      ? invite.role === "admin"
        ? "as an admin"
        : "as a moderator"
      : "to join";

/**
 * Invites for contacts picked in a list (ContactMember), one each, with the
 * same purpose/role the panel would use. Returns how many went out.
 */
export const inviteEntities = async (
  realmId: string,
  entityIds: string[],
  extra: Record<string, string> = {},
) => {
  const results = await Promise.allSettled(
    entityIds.map((id) =>
      CreateRealmInviteRequest({
        realm_id: realmId,
        kind: "invite",
        target_entity_id: id,
        ...extra,
      }),
    ),
  );
  const failed = results.filter((r) => r.status === "rejected") as any[];
  return {
    sent: results.length - failed.length,
    firstError: failed[0]?.reason,
  };
};
