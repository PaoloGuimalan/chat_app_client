import { entityProfileStore, type EntityProfileStore } from "./entityProfileStore";

export interface EntityProfileTarget { entityId: string; url: string | null }
interface ProfileAuthentication {
  auth: boolean | null;
  active_entity_context?: { id?: string; profile?: string | null };
}

export function activeEntityProfile(authentication: ProfileAuthentication): EntityProfileTarget | null {
  if (authentication.auth !== true) return null;
  const active = authentication.active_entity_context;
  if (!active?.id) return null;
  // The personal user payload can carry a different ID/photo after a switch.
  // Use the validated current context for BOTH halves of the cache record.
  const entityId = active.id;
  const raw = active.profile;
  const url = typeof raw === "string" && raw.trim() && !["none", "n/a"].includes(raw.trim().toLowerCase()) ? raw : null;
  return { entityId, url };
}

function currentSessionToken(): string | null {
  try { return localStorage.getItem("authtoken"); } catch { return null; }
}

const MAX_BYTES = 10 * 1024 * 1024;
const isImage = (blob: unknown): blob is Blob => blob instanceof Blob && blob.type.startsWith("image/") && blob.size > 0 && blob.size <= MAX_BYTES;

async function fetchAvatar(target: EntityProfileTarget, signal: AbortSignal): Promise<Blob> {
  const response = await fetch(target.url!, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", signal });
  if (!response.ok || response.type === "opaque") throw new Error("Avatar image unavailable");
  if (Number(response.headers.get("content-length")) > MAX_BYTES) throw new Error("Avatar image too large");
  return response.blob();
}

interface CacheDependencies {
  store: EntityProfileStore;
  fetchBlob?: (target: EntityProfileTarget, signal: AbortSignal) => Promise<Blob>;
  getToken?: () => string | null;
  now?: () => number;
}

// Called from AuthCheck on page load only. No subscriptions, upload hooks,
// expiry-based downloads, or changes to the webapp's normal avatar rendering.
export function createEntityProfileCache({ store, fetchBlob = fetchAvatar, getToken = currentSessionToken, now = Date.now }: CacheDependencies) {
  const pending = new Map<string, Promise<void>>();

  function sync(target: EntityProfileTarget | null, token: string | null): Promise<void> {
    if (!target || !token || token !== getToken()) return Promise.resolve();
    const key = JSON.stringify([token, target.entityId, target.url]);
    const existing = pending.get(key);
    if (existing) return existing;

    const job = (async () => {
      const cached = await store.get(target.entityId);
      if (token !== getToken()) return;
      if (target.url && cached?.url === target.url && isImage(cached.blob)) return;
      // A removed/changed avatar must not leave the old image behind.
      if (cached) await store.remove(target.entityId);
      if (!target.url || token !== getToken()) return;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const blob = await fetchBlob(target, controller.signal);
        if (controller.signal.aborted || token !== getToken() || !isImage(blob)) return;
        await store.put({ entityId: target.entityId, url: target.url, blob, updatedAt: now() });
      } finally {
        clearTimeout(timer);
      }
    })().catch(() => { /* Optional presentation cache must not fail authentication. */ })
      .finally(() => { pending.delete(key); });
    pending.set(key, job);
    return job;
  }
  return { sync };
}

export const entityProfileCache = createEntityProfileCache({ store: entityProfileStore });
