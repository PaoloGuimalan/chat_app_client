export type RoleName = "owner" | "admin" | "moderator" | "member";

export interface RoleDefinition {
  id: number;
  name: RoleName;
  is_default: boolean;
  permissions: string[];
}

/** Defaults are explicit: duplicate names never imply interchangeable roles. */
export const defaultRole = (roles: RoleDefinition[], name: RoleName) =>
  roles.find((role) => role.name === name && role.is_default);

export const roleLabel = (role: RoleDefinition) =>
  `${role.name[0].toUpperCase()}${role.name.slice(1)} · #${role.id}${role.is_default ? " (default)" : ""}`;

export const roleSummary = (role: RoleDefinition) =>
  role.permissions.length ? role.permissions.join(", ") : "No permissions";
