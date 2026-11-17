/** Recover a revoked acting identity through the existing switch-back flow. */
export function revokedRealmMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  const detail = typeof data.detail === "string" ? data.detail : "";
  if (detail.startsWith("REALM_ACCESS_REVOKED:")) return detail.slice("REALM_ACCESS_REVOKED:".length).trim();
  return data.code === "REALM_ACCESS_REVOKED" && typeof data.message === "string" ? data.message : null;
}

export function createRealmAccessRecovery(dependencies: {
  readToken: () => string | null;
  switchBack: (expectedToken: string, message: string) => Promise<boolean>;
}) {
  const pending = new Map<string, Promise<boolean>>();
  return async (body: unknown, token?: string | null): Promise<boolean> => {
    const message = revokedRealmMessage(body);
    if (!message || !token) return false;
    if (dependencies.readToken() !== token) return true; // A late frame belongs to the old identity.
    const existing = pending.get(token);
    if (existing) return existing;
    const recovery = Promise.resolve().then(() => dependencies.readToken() !== token ? true : dependencies.switchBack(token, message)).catch(() => false);
    pending.set(token, recovery);
    try { return await recovery || dependencies.readToken() !== token; }
    finally { if (pending.get(token) === recovery) pending.delete(token); }
  };
}

const noticeKey = "chatterloop:realm-access-revoked";
export function saveRealmRevocationNotice(storage: Storage, entityId: string, content: string, createdAt = Date.now()) {
  try { storage.setItem(noticeKey, JSON.stringify({ entityId, content, createdAt })); } catch { /* Storage may be disabled. */ }
}
export function consumeRealmRevocationNotice(storage: Storage, entityId: string, now = Date.now()): string | null {
  try {
    const raw = storage.getItem(noticeKey);
    if (!raw) return null;
    const notice = JSON.parse(raw);
    if (typeof notice.content !== "string" || !Number.isFinite(notice.createdAt) || now < notice.createdAt || now - notice.createdAt > 300000) {
      storage.removeItem(noticeKey); return null;
    }
    if (notice.entityId !== entityId) return null;
    storage.removeItem(noticeKey);
    return notice.content;
  } catch { return null; }
}
