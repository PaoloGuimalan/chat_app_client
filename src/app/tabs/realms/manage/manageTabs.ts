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

export type ManageRealmTab = 'dashboard' | 'details' | 'media' | 'members' | 'followers' | 'notifications' | 'permissions' | 'approvals' | 'archived' | 'lifecycle';
export const hasRoleManagementCapabilities = (caps?: IRealmProfileInfo['capabilities']) =>
  caps?.can_manage_roles === true || caps?.can_manage_permissions === true;
export const canManageRealm = (realm: IRealmProfileInfo) => realm.capabilities != null
  ? realm.capabilities.can_manage === true || hasRoleManagementCapabilities(realm.capabilities) || realm.capabilities.can_deactivate_realm === true || realm.capabilities.can_delete_realm === true
  : realm.is_admin || (realm.type === 'community' && realm.my_role === 'moderator');

/** Every realm uses current capabilities; unrelated legacy sections retain their fallback. */
export function manageRealmTabs(realm: IRealmProfileInfo): { key: ManageRealmTab; label: string }[] {
  const caps = realm.capabilities;
  const moderator = realm.type === 'community' && realm.my_role === 'moderator';
  const items: { key: ManageRealmTab; label: string }[] = [];
  if (caps ? caps.can_update_realm : !moderator) items.push({ key: 'dashboard', label: 'Dashboard' }, { key: 'details', label: 'Profile Details' });
  if (hasMediaTab(realm) && (caps ? caps.can_update_media : !moderator)) items.push({ key: 'media', label: 'Media' });
  if (caps ? caps.can_view_members || caps.can_assign_roles || caps.can_invite_members || caps.can_remove_members || caps.can_review_join_requests || caps.can_decline_join_requests : true) items.push({ key: 'members', label: 'Members' });
  if (realm.type === 'community' && (caps ? caps.can_view_notifications : true)) items.push({ key: 'notifications', label: 'Notifications' });
  if (realm.type === 'community' && caps && (caps.can_review_posts || caps.can_review_invites || caps.can_review_join_requests || caps.can_decline_join_requests)) items.push({ key: 'approvals', label: 'Approvals' });
  if (realm.type === 'community' && caps?.can_archive_community_posts) items.push({ key: 'archived', label: 'Archived' });
  if (caps && (caps.can_manage_roles || caps.can_manage_permissions)) items.push({ key: 'permissions', label: 'Permissions' });
  if (realm.type === 'page') items.push({ key: 'followers', label: 'Followers' });
  if (caps?.can_deactivate_realm || caps?.can_delete_realm) items.push({key: 'lifecycle', label: 'Deactivation & deletion'});
  return items;
}
