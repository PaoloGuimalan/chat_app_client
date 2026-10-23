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

async function normalizeAvatarBlob(blob: Blob): Promise<Blob> {
  if (!(blob instanceof Blob) || blob.size === 0) throw new Error("Avatar response is empty or is not a Blob");
  if (blob.size > MAX_BYTES) throw new Error(`Avatar response exceeds 10 MiB (${blob.size} bytes)`);
  if (blob.type.startsWith("image/")) return blob;

  // Older stored avatars may be served as downloadable binary rather than
  // image/*. Identify actual image bytes, never guess from the URL extension.
  const bytes = new Uint8Array(await blob.slice(0, 64).arrayBuffer());
  const matches = (signature: number[], offset = 0) =>
    bytes.length >= offset + signature.length && signature.every((value, index) => bytes[offset + index] === value);
  const text = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length));
  let mime: string | undefined;
  if (matches([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) mime = "image/png";
  else if (matches([0xff, 0xd8, 0xff])) mime = "image/jpeg";
  else if (["GIF87a", "GIF89a"].includes(text(0, 6))) mime = "image/gif";
  else if (text(0, 4) === "RIFF" && text(8, 4) === "WEBP") mime = "image/webp";
  else if (text(4, 4) === "ftyp") {
    const brands = [text(8, 4)];
    for (let offset = 16; offset + 4 <= bytes.length; offset += 4) brands.push(text(offset, 4));
    if (brands.some(brand => ["avif", "avis"].includes(brand))) mime = "image/avif";
  }
  if (!mime) throw new Error(`Avatar bytes are not a supported image (MIME: ${blob.type || "missing"}, ${blob.size} bytes)`);
  return blob.slice(0, blob.size, mime);
}

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
        const downloaded = await fetchBlob(target, controller.signal);
        if (controller.signal.aborted || token !== getToken()) return;
        const blob = await normalizeAvatarBlob(downloaded);
        if (controller.signal.aborted || token !== getToken()) return;
        await store.put({ entityId: target.entityId, url: target.url, blob, updatedAt: now() });
      } finally {
        clearTimeout(timer);
      }
    })().catch(error => {
      // Do not fail authentication, but keep actual fetch/storage failures
      // observable without printing session credentials or image URLs.
      console.warn("[Studio avatar cache] Active entity avatar was not cached", {
        entityId: target.entityId,
        reason: error instanceof Error ? error.message : "Image or storage unavailable",
      });
    })
      .finally(() => { pending.delete(key); });
    pending.set(key, job);
    return job;
  }
  return { sync };
}

export const entityProfileCache = createEntityProfileCache({ store: entityProfileStore });
