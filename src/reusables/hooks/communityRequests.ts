import { firstPartyClient } from "./requests";
import envs from "./env_configs";
import type { CommunityInvite, ICommunityMetadata } from "../vars/interfaces";
import type { PaginationProp } from "../vars/props";

export interface CommunityCard extends ICommunityMetadata {
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
  | { status: boolean; is_member: true }
  | { status: boolean; message: string; result: CommunityInvite };

const baseUrl = () => `${envs.USER_SERVICE_API}/api/realm/communities`;
const headers = () => ({ "x-access-token": localStorage.getItem("authtoken") });
const communityUrl = (id: string) => `${baseUrl()}/${encodeURIComponent(id)}`;

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
