// Deterministic entity-id resolver — TS mirror of the canonical Python helper
// (entity/services.py / entity/models.py) and the JS mirror
// (server/reusables/hooks/entity.js). The format string lives ONLY in these
// three files; everything else calls these helpers.
//
// Format: entity:<type>:<source_id>
//   entity:user:<account.id>       (uuid)
//   entity:realm:<realm.realm_id>  (15-digit business key)

export type EntityType = "user" | "realm";

export const ENTITY_TYPE_USER: EntityType = "user";
export const ENTITY_TYPE_REALM: EntityType = "realm";

export function buildEntityId(
  entityType: string,
  sourceId: string,
): string {
  return `entity:${String(entityType).trim().toLowerCase()}:${sourceId}`;
}

export function userEntity(accountId: string): string {
  return buildEntityId(ENTITY_TYPE_USER, accountId);
}

export function realmEntity(realmId: string): string {
  return buildEntityId(ENTITY_TYPE_REALM, realmId);
}

export interface ParsedEntityId {
  type: EntityType | null;
  sourceId: string | null;
}

// `sourceId` may itself contain colons, so we split with a limit of 3 parts.
export function parseEntityId(entityId: string | null | undefined): ParsedEntityId {
  if (!entityId || typeof entityId !== "string") {
    return { type: null, sourceId: null };
  }
  const idx1 = entityId.indexOf(":");
  if (idx1 === -1 || entityId.slice(0, idx1) !== "entity") {
    return { type: null, sourceId: null };
  }
  const idx2 = entityId.indexOf(":", idx1 + 1);
  if (idx2 === -1) {
    return { type: null, sourceId: null };
  }
  return {
    type: entityId.slice(idx1 + 1, idx2) as EntityType,
    sourceId: entityId.slice(idx2 + 1),
  };
}

export function isEntityId(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("entity:");
}

// Back-compat: legacy message records store a bare user-id string. Treat any
// non-entity value as a user entity so the UI can compare uniformly.
export function normalizeSender(value: string | null | undefined): string | null | undefined {
  if (value == null) return value;
  return isEntityId(value) ? value : userEntity(value);
}
