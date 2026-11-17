import type { CommunityInvite, ICommunityMetadata, IPost } from "./interfaces";
import type { RoleDefinition } from "./roles";
import type { PaginationProp } from "./props";

export type ApprovalState = 0 | 1 | 2;
export type ApprovalKind = "posts" | "invites" | "joins";
export type RealmCapability =
  | "can_manage"
  | "can_update_realm"
  | "can_update_media"
  | "can_assign_roles"
  | "can_view_members"
  | "can_invite_members"
  | "can_publish_invites"
  | "can_revoke_invites"
  | "can_remove_members"
  | "can_manage_roles"
  | "can_manage_permissions"
  | "can_review_posts"
  | "can_review_invites"
  | "can_review_join_requests"
  | "can_decline_join_requests"
  | "can_take_down_posts"
  | "can_archive_community_posts"
  | "can_view_notifications"
  | "can_submit_posts"
  | "can_publish_posts";
/** UI hints only. Every mutation is reauthorized by the service. */
export type RealmCapabilities = Partial<Record<RealmCapability, boolean>>;
export interface RealmFeatures {
  realm_role_configuration?: boolean;
  community_approvals?: boolean;
  submissions_supported?: boolean;
}
export interface ReviewDecision {
  id: string;
  action:
    | "submit"
    | "edit"
    | "approve"
    | "reject"
    | "takedown"
    | "revoke"
    | "accept"
    | "decline";
  target_kind: "post" | "invite" | "join";
  target_id: string;
  previous_state: {
    approval?: ApprovalState;
    status?: string;
    published?: boolean;
  };
  new_state: { approval?: ApprovalState; status?: string; published?: boolean };
  reason: string;
  content_version: string | null;
  created_at: string;
}
export interface CommunitySubmission {
  post: IPost;
  approval: ApprovalState;
  content_version: string;
  decision: ReviewDecision | null;
  read_only?: boolean;
  shared_preview?: IPost["shared_preview"];
}
export type ApprovalPage<T = CommunitySubmission | CommunityInvite> =
  PaginationProp<T> & {
    counts: Partial<Record<ApprovalKind, number>>;
  };
export interface PostReviewInput {
  action: "approve" | "reject" | "takedown";
  expected_approval: ApprovalState;
  expected_version: string;
  reason?: string;
}
export interface RealmPermissionSettings {
  features: RealmFeatures;
  capabilities: RealmCapabilities;
  roles: RoleDefinition[];
  catalog: { permission: string; description: string; grantable?: boolean }[];
}
export interface RealmReviewDetail {
  source: "community";
  decision: ReviewDecision;
  community: ICommunityMetadata;
  viewer_is_owner: boolean;
  content: IPost | null;
  content_is_current: boolean;
  current_content_version: string | null;
  matches_reviewed_version: boolean;
  moderation: {
    source: "community";
    verdict: ReviewDecision["action"];
    reason: string;
    removed: boolean;
    enforced_at: string;
  };
}
