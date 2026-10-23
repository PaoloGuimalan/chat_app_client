// Fallback until the existing boot request supplies the current Variable.
export const DEFAULT_PROFILE_PATHS = [
  "api", "assets", "conference", "contacts", "delete-account", "design",
  "edits", "explore", "invite", "login", "mapfeed", "messages", "moderation",
  "moments", "notes", "notifications", "pages", "post", "privacy", "realms",
  "register", "scenes", "servers", "settings", "setup", "share", "studio",
  "studios", "support", "terms", "topics", "user", "verification",
];
let reserved = new Set(DEFAULT_PROFILE_PATHS);
const normalize = (value: string) => value.normalize("NFKC").trim().toUpperCase().toLowerCase().replace(/ß/g, "ss");
let version = 0;
const listeners = new Set<() => void>();
export const profilePathsVersion = () => version;
export function subscribeProfilePaths(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
// Populated by the existing public boot configuration. Backend validation
// always reads the current Variable; browser values only provide feedback.
export function applyReservedProfilePaths(paths: unknown): void {
  if (!Array.isArray(paths) || paths.some(path => typeof path !== "string" || !normalize(path) || /[\x00-\x1f\x7f]/.test(path) || /[\\/%?#]/.test(normalize(path)) || [".", ".."].includes(normalize(path)))) return;
  const next = new Set(paths.map(normalize));
  if (next.size === reserved.size && [...next].every(path => reserved.has(path))) return;
  reserved = next;
  version++;
  listeners.forEach(listener => listener());
}
export const isReservedProfilePath = (value: string | undefined | null): boolean =>
  typeof value === "string" && reserved.has(normalize(value));

export function profilePathError(value: string | undefined | null): { code: string; message: string } | null {
  if (!value) return null;
  if (/[\x00-\x1f\x7f]/.test(value) || /[\\/%?#]/.test(normalize(value)) || [".", ".."].includes(normalize(value))) return { code: "INVALID_PROFILE_PATH", message: "Choose a single link name without URL separators or control characters." };
  if (isReservedProfilePath(value)) return { code: "RESERVED_PATH", message: "This link name is reserved by Chatterloop. Choose another name." };
  return null;
}
