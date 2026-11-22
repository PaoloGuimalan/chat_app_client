import type { RealmCapabilities } from './realmApprovals';

export interface RealmLifecycle {
  realm_id: string;
  name: string;
  kind: string;
  return_server_id?: string | null;
  capabilities: RealmCapabilities;
  child_count: number;
  owned_realm_blocker_count: number;
  owned_realm_blockers: { id: string; name: string }[];
  consequences: { preserves_data_on_deactivate: boolean; delete_is_permanent: boolean; includes_channels: boolean };
}
export interface RecoveryRealm {
  realm_id: string;
  name: string;
  kind: string;
  profile: string | null;
  deactivated_at: string;
  actors: { entity_id: string; name: string; is_personal: boolean }[];
  blocked_by_parent: boolean;
  parent_recovery_realm_id: string | null;
}
export interface RecoveryPage { items: RecoveryRealm[]; next_cursor: string | null }
