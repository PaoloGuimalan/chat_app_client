import { firstPartyClient } from "./requests";
import envs from "./env_configs";
import type { CommunityInvite, ICommunityMetadata, IEntityRef } from "../vars/interfaces";
import type { PaginationProp } from "../vars/props";
import type { RoleDefinition } from '../vars/roles';
import type { IPost } from '../vars/interfaces';
import type { ApprovalKind, ApprovalPage, CommunitySubmission, PostReviewInput, RealmPermissionSettings, RealmReviewDetail, ReviewDecision } from '../vars/realmApprovals';

export interface CommunityCard extends ICommunityMetadata {
  capabilities?: import('../vars/realmApprovals').RealmCapabilities;
  features?: import('../vars/realmApprovals').RealmFeatures;
  description: string;
  cover_photo: string;
  type: "community";
  member_count: number | null;
  my_role: string | null;
  request_pending: boolean;
}

export interface CommunityDirectoryQuery {
  search?: string;
  joined?: boolean;
  page?: number;
  page_size?: number;
  tagged_entities?: string;
}

export interface CreateCommunityInput {
  name: string;
  description?: string;
  slug: string;
  is_private?: boolean;
}

export interface CommunityResult {
  status: boolean;
  result: CommunityCard;
}

export type CommunityJoinResult =
  | { status: boolean; is_member: true; }
  | { status: boolean; message: string; result: CommunityInvite; };

export interface CommunityNotification {
  id: string;
  type:
    | "community_join_request"
    | "community_member_joined"
    | "community_post_created"
    | "community_post_pending"
    | "community_invite_pending"
    | "post_comment"
    | "post_reaction"
    | "comment_reaction";
  description: string;
  actor: IEntityRef | null;
  is_anonymous: boolean;
  created_at: string;
  request_id: string | null;
  request_status: "pending" | "accepted" | "declined" | "revoked" | null;
  post_id: string | null;
  anchor: string | null;
  approval_id?: string | null;
  approval_target_id?: string | null;
  approval_kind?: 'posts' | 'invites' | null;
  approval_pending?: boolean;
}

export async function listCommunityApprovals(realmId: string, query: { kind?: ApprovalKind; state?: 'pending' | 'not_approved'; page?: number; target_id?: string } = {}) {
  return (await firstPartyClient.get<ApprovalPage>(`${communityUrl(realmId)}/approvals`, { headers: headers(), params: query })).data;
}
export async function reviewCommunityPost(realmId: string, postId: string, input: PostReviewInput) {
  return (await firstPartyClient.post<{ status: boolean; result: ReviewDecision }>(`${communityUrl(realmId)}/approvals/posts/${encodeURIComponent(postId)}`, input, { headers: headers() })).data.result;
}
export async function reviewCommunityInvitation(realmId: string, kind: 'joins' | 'invites', inviteId: string, action: 'approve' | 'reject', expectedStatus: 'pending' | 'for_approval') {
  return (await firstPartyClient.post(`${communityUrl(realmId)}/approvals/${kind}/${encodeURIComponent(inviteId)}`, { action, expected_status: expectedStatus }, { headers: headers() })).data;
}
export async function getRealmPermissions(realmId: string) {
  return (await firstPartyClient.get<{ status: boolean; result: RealmPermissionSettings }>(`${envs.USER_SERVICE_API}/api/realm/realms/${encodeURIComponent(realmId)}/permissions`, { headers: headers() })).data.result;
}
export async function saveRealmPermissions(realmId: string, roles: { role_id: number; permissions: string[] }[]) {
  return (await firstPartyClient.put(`${envs.USER_SERVICE_API}/api/realm/realms/${encodeURIComponent(realmId)}/permissions`, { roles }, { headers: headers() })).data;
}
export async function createRealmRole(realmId: string, name: string, permissions?: string[]): Promise<RoleDefinition> {
  return (await firstPartyClient.post(`${envs.USER_SERVICE_API}/api/entity/roles`, { realm_id: realmId, name, ...(permissions ? { permissions } : {}) }, { headers: headers() })).data.result;
}
export async function updateRealmRole(realmId: string, roleId: number, fields: { name?: string; permissions?: string[] }): Promise<RoleDefinition> {
  return (await firstPartyClient.put(`${envs.USER_SERVICE_API}/api/entity/roles/${roleId}`, { realm_id: realmId, ...fields }, { headers: headers() })).data.result;
}
export async function deleteRealmRole(realmId: string, roleId: number) {
  return (await firstPartyClient.delete(`${envs.USER_SERVICE_API}/api/entity/roles/${roleId}`, { headers: headers(), params: { realm_id: realmId } })).data;
}
export async function listAuthorSubmissions(query: { page?: number } = {}) {
  return (await firstPartyClient.get<PaginationProp<CommunitySubmission>>(`${envs.USER_SERVICE_API}/api/newsfeed/submissions`, { headers: headers(), params: query })).data;
}
export async function getAuthorSubmission(postId: string) {
  return (await firstPartyClient.get<{ status: boolean; result: CommunitySubmission }>(`${envs.USER_SERVICE_API}/api/newsfeed/submissions/${encodeURIComponent(postId)}`, { headers: headers() })).data.result;
}
export async function getRealmReviewDecision(decisionId: string) {
  return (await firstPartyClient.get<{ status: boolean; data: RealmReviewDetail }>(`${envs.USER_SERVICE_API}/api/entity/realm-review/${encodeURIComponent(decisionId)}/`, { headers: headers() })).data.data;
}
export async function listCommunityArchive(realmId: string, page = 1) {
  return (await firstPartyClient.get<PaginationProp<IPost>>(`${communityUrl(realmId)}/archive`, { headers: headers(), params: { page } })).data;
}
export async function archiveCommunityPost(realmId: string, postId: string, archived: boolean) {
  return (await firstPartyClient.post(`${communityUrl(realmId)}/archive/${encodeURIComponent(postId)}`, { is_archived: archived }, { headers: headers() })).data;
}

const baseUrl = () => `${envs.USER_SERVICE_API}/api/realm/communities`;
const headers = () => ({ "x-access-token": localStorage.getItem("authtoken") });
const communityUrl = (id: string) => `${baseUrl()}/${encodeURIComponent(id)}`;

export async function listCommunityNotifications(
  realmId: string,
  query: { page?: number; } = {},
) {
  const response = await firstPartyClient.get<PaginationProp<CommunityNotification> & { activity_revision: number; }>(
    `${communityUrl(realmId)}/notifications`,
    { headers: headers(), params: query },
  );
  return response.data;
}

export async function acknowledgeCommunityNotifications(realmId: string, activityRevision: number, notificationIds: string[]) {
  const response = await firstPartyClient.post(
    `${communityUrl(realmId)}/notifications/read`,
    { activity_revision: activityRevision, notification_ids: notificationIds },
    { headers: headers() },
  );
  return response.data;
}

export async function listCommunities(query: CommunityDirectoryQuery = {}) {
  const response = await firstPartyClient.get<PaginationProp<CommunityCard>>(
    baseUrl(),
    { headers: headers(), params: query },
  );
  return response.data;
}

export async function getCommunity(id: string) {
  const response = await firstPartyClient.get<CommunityResult>(
    communityUrl(id),
    {
      headers: headers(),
    },
  );
  return response.data;
}

export async function createCommunity(input: CreateCommunityInput) {
  const response = await firstPartyClient.post<CommunityResult>(
    baseUrl(),
    input,
    {
      headers: headers(),
    },
  );
  return response.data;
}

export async function joinCommunity(realmId: string) {
  const response = await firstPartyClient.post<CommunityJoinResult>(
    `${communityUrl(realmId)}/join`,
    {},
    { headers: headers() },
  );
  return response.data;
}

export async function leaveCommunity(
  realmId: string,
  cancelRequestOnly = false,
) {
  const response = await firstPartyClient.post<{
    status: boolean;
    is_member: boolean;
  }>(
    `${communityUrl(realmId)}/leave`,
    cancelRequestOnly ? { cancel_request: true } : {},
    { headers: headers() },
  );
  return response.data;
}
