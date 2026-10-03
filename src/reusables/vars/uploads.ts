import envs from "@/reusables/hooks/env_configs";

// Upload limits per feature, as the SERVER enforces them.
//
// The source of truth is the platform settings table (core_variable, edited in
// the Django admin), served by GET /media/config. loadMediaConfig() fetches it
// on every app boot; until it answers - or if it never does - the defaults
// below apply. They mirror the server's own defaults
// (server/reusables/media/config.js), so a client that couldn't load the
// config still agrees with a server that couldn't either.
//
// The server checks again at upload time and storage refuses a wrong size on
// its own, so a stale limit here only means the user hears "too big" a step
// later - never that something too big gets through.

export type UploadFeature =
  | "message"
  | "voice_note"
  | "post_media"
  | "moment"
  | "moment_poster"
  | "diary"
  | "avatar"
  | "cover"
  | "comment";

export interface UploadLimit {
  maxMB: number;
  types: string[];
}

export interface UploadTransfer {
  multipartThresholdMB: number;
  partSizeMB: number;
  concurrency: number;
}

const DEFAULT_LIMITS: Record<UploadFeature, UploadLimit> = {
  message: { maxMB: 100, types: ["*"] },
  voice_note: { maxMB: 25, types: ["audio/*"] },
  post_media: { maxMB: 100, types: ["image/*", "video/*"] },
  moment: { maxMB: 100, types: ["image/*", "video/mp4"] },
  moment_poster: { maxMB: 10, types: ["image/jpeg", "image/png"] },
  diary: { maxMB: 100, types: ["*"] },
  avatar: { maxMB: 10, types: ["image/*"] },
  cover: { maxMB: 10, types: ["image/*"] },
  comment: { maxMB: 10, types: ["image/*"] },
};

const DEFAULT_TRANSFER: UploadTransfer = {
  multipartThresholdMB: 16,
  partSizeMB: 8,
  concurrency: 4,
};

// The last config this browser loaded, so a reload starts with real limits
// rather than the defaults.
const STORAGE_KEY = "chatterloop:media-config";

let limits: Record<string, UploadLimit> = { ...DEFAULT_LIMITS };
let transfer: UploadTransfer = { ...DEFAULT_TRANSFER };

const isPositive = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

const apply = (raw: any) => {
  if (raw?.limits && typeof raw.limits === "object") {
    const next: Record<string, UploadLimit> = { ...DEFAULT_LIMITS };
    for (const [feature, value] of Object.entries<any>(raw.limits)) {
      if (isPositive(value?.maxMB)) {
        next[feature] = {
          maxMB: value.maxMB,
          types:
            Array.isArray(value.types) && value.types.length
              ? value.types
              : ["*"],
        };
      }
    }
    limits = next;
  }
  if (raw?.transfer && typeof raw.transfer === "object") {
    const t = raw.transfer;
    transfer = {
      multipartThresholdMB: isPositive(t.multipartThresholdMB)
        ? t.multipartThresholdMB
        : DEFAULT_TRANSFER.multipartThresholdMB,
      partSizeMB: Math.max(
        isPositive(t.partSizeMB) ? t.partSizeMB : DEFAULT_TRANSFER.partSizeMB,
        5,
      ),
      concurrency: Math.min(
        Math.max(isPositive(t.concurrency) ? Math.round(t.concurrency) : 4, 1),
        8,
      ),
    };
  }
};

try {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) apply(JSON.parse(cached));
} catch {
  // No storage, or a corrupt entry - the defaults stand.
}

/** Fetches the limits; call once on app boot. Never throws. */
export const loadMediaConfig = async (): Promise<void> => {
  try {
    const response = await fetch(`${envs.CHATTERLOOP_API}/media/config`);
    if (!response.ok) return;
    const body = await response.json();
    apply(body);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ limits: body.limits, transfer: body.transfer }),
      );
    } catch {
      // Storage full or blocked - this session still has the fresh values.
    }
  } catch {
    // Offline or the server is down: keep what we have.
  }
};

export const limitFor = (feature: UploadFeature) => {
  const limit = limits[feature] ?? DEFAULT_LIMITS[feature];
  return {
    ...limit,
    maxBytes: Math.floor(limit.maxMB * 1024 * 1024),
    /** For user-facing copy - "Files here can be at most 100MB". */
    label: `${limit.maxMB}MB`,
  };
};

export const transferSettings = (): UploadTransfer => transfer;

/** Whether `mime` matches any of the patterns ("*", "image/*", "video/mp4"). */
export const typeAllowed = (mime: string, types: string[]) => {
  const value = (mime || "").toLowerCase();
  return types.some((pattern) => {
    const p = pattern.toLowerCase();
    if (p === "*" || p === "*/*") return true;
    if (p.endsWith("/*")) return value.startsWith(p.slice(0, -1));
    return value === p;
  });
};

/** "2.4 MB", "830 KB" - for file cards. */
export const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
};
