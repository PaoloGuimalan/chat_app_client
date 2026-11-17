export type RoleName = "owner" | "admin" | "moderator" | "member";

export interface RoleDefinition {
  id: number;
  name: string;
  code?: string;
  realm_id?: string | null;
  editable?: boolean;
  permissions_editable?: boolean;
  assignable?: boolean;
  disabled_reason?: string | null;
  is_default: boolean;
  permissions: string[];
}

/** Defaults are explicit: duplicate names never imply interchangeable roles. */
export const defaultRole = (roles: RoleDefinition[], name: RoleName, realmId?: string) =>
  roles.find((role) => role.code === name && role.is_default && role.realm_id != null &&
    (realmId == null || role.realm_id === realmId));

export const roleLabel = (role: RoleDefinition) =>
  `${role.name.charAt(0).toUpperCase()}${role.name.slice(1)} · #${role.id}${role.is_default ? " (default)" : ""}`;

/** The server supplies assignment eligibility for this exact realm. */
export const canInviteWithRole = (role: RoleDefinition) => role.assignable !== false &&
  role.realm_id != null && role.code !== "owner";

export const roleSummary = (role: RoleDefinition) =>
  role.permissions.length ? role.permissions.join(", ") : "No permissions";
