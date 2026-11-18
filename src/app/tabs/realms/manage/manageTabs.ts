import { IRealmProfileInfo } from "@/reusables/vars/interfaces";

/** A text channel can still come back as a "group" with a parent server. */
const isChannel = (realm: IRealmProfileInfo) =>
  realm.type === "channel" ||
  realm.type === "voice" ||
  (realm.type === "group" && !!realm.parent);

/**
 * Whether the realm gets the Media tab (profile and cover photo). Channels -
 * text and voice - and conferences show neither anywhere, so there is
 * nothing for it to manage. Read by the manage page and ManageRealmModal.
 */
export const hasMediaTab = (realm: IRealmProfileInfo) =>
  !isChannel(realm) && realm.type !== "conference";

export type ManageRealmTab = 'dashboard' | 'details' | 'media' | 'members' | 'followers' | 'notifications' | 'permissions' | 'approvals' | 'archived';
export const canManageRealm = (realm: IRealmProfileInfo) => realm.type === 'community' && realm.capabilities != null
  ? realm.capabilities.can_manage === true : realm.is_admin || (realm.type === 'community' && realm.my_role === 'moderator');

/** Community entry points follow current capabilities; other realm layouts stay intact. */
export function manageRealmTabs(realm: IRealmProfileInfo): { key: ManageRealmTab; label: string }[] {
  const caps = realm.type === 'community' ? realm.capabilities : undefined;
  const moderator = realm.type === 'community' && realm.my_role === 'moderator';
  const items: { key: ManageRealmTab; label: string }[] = [];
  if (caps ? caps.can_update_realm : !moderator) items.push({ key: 'dashboard', label: 'Dashboard' }, { key: 'details', label: 'Profile Details' });
  if (hasMediaTab(realm) && (caps ? caps.can_update_media : !moderator)) items.push({ key: 'media', label: 'Media' });
  if (caps ? caps.can_view_members || caps.can_assign_roles || caps.can_invite_members || caps.can_remove_members : true) items.push({ key: 'members', label: 'Members' });
  if (realm.type === 'community' && (caps ? caps.can_view_notifications : true)) items.push({ key: 'notifications', label: 'Notifications' });
  if (caps && (caps.can_review_posts || caps.can_review_invites || caps.can_review_join_requests || caps.can_decline_join_requests)) items.push({ key: 'approvals', label: 'Approvals' });
  if (caps?.can_archive_community_posts) items.push({ key: 'archived', label: 'Archived' });
  if (caps && (caps.can_manage_roles || caps.can_manage_permissions)) items.push({ key: 'permissions', label: 'Permissions' });
  if (realm.type === 'page') items.push({ key: 'followers', label: 'Followers' });
  return items;
}
