/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared bits for Moments & Thoughts: lifetimes, moods, and naming the entity
 * behind one. Kept here so the board, the viewer, the Thoughts rail and the
 * profile bubble all phrase "21h left" and "Hungry" the same way.
 */
import type {
  EphemeralAudience,
  IEntityRef,
  IFlexibleEntity,
  ThoughtMood,
} from "@/reusables/vars/interfaces";

/** Fired after a moment is posted, edited or deleted, so every board and
 *  ring reloads. */
export const MOMENTS_CHANGED_EVENT = "moments_changed";

/** Fired after your own thought is posted, edited or deleted. */
export const THOUGHTS_CHANGED_EVENT = "thoughts_changed";

/** A moment or thought lives 24h. Server: EPHEMERAL_LIFETIME. */
export const EPHEMERAL_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const THOUGHT_MAX_LENGTH = 60;
export const MOMENT_CAPTION_MAX_LENGTH = 120;

/** Characters as the server counts them - code points, so an emoji is one. */
export const charCount = (text: string) => [...text].length;

/** "21h left" / "35m left" / "expired". */
export const timeLeftLabel = (expiresAt: string | null | undefined, now = Date.now()) => {
  if (!expiresAt) return "";
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "expired";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m left`;
  return `${Math.floor(minutes / 60)}h left`;
};

/** "3h ago" / "12m ago" / "just now". */
export const timeAgoLabel = (date: string | null | undefined, now = Date.now()) => {
  if (!date) return "";
  const minutes = Math.floor((now - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

/** How much of its 24h a moment has left, 0..1 - the tile's bottom bar. */
export const remainingFraction = (
  expiresAt: string | null | undefined,
  now = Date.now(),
) => {
  if (!expiresAt) return 0;
  const left = new Date(expiresAt).getTime() - now;
  return Math.min(1, Math.max(0, left / EPHEMERAL_LIFETIME_MS));
};

/** Whether it has run out on this device's clock - the viewer's hard stop. */
export const isExpired = (expiresAt: string | null | undefined, now = Date.now()) =>
  !!expiresAt && new Date(expiresAt).getTime() <= now;

/** Mood chips: the order, glyph and colours the designs use. */
export const THOUGHT_MOODS: {
  key: ThoughtMood;
  label: string;
  icon: string;
  bg: string;
  fg: string;
}[] = [
  { key: "chilling", label: "Chilling", icon: "self_improvement", bg: "var(--green-soft)", fg: "var(--green-strong)" },
  { key: "busy", label: "Busy", icon: "work", bg: "var(--pink-soft)", fg: "var(--pink)" },
  { key: "focused", label: "Focused", icon: "headphones", bg: "var(--brand-soft)", fg: "var(--brand)" },
  { key: "traveling", label: "Traveling", icon: "flight", bg: "var(--brand-soft)", fg: "var(--brand)" },
  { key: "celebrating", label: "Celebrating", icon: "celebration", bg: "var(--gold-soft)", fg: "var(--gold-700)" },
  { key: "resting", label: "Resting", icon: "bedtime", bg: "var(--surface-3)", fg: "var(--text-2)" },
  { key: "hungry", label: "Hungry", icon: "restaurant", bg: "var(--gold-soft)", fg: "var(--gold-700)" },
];

export const moodOf = (mood: ThoughtMood | null | undefined) =>
  THOUGHT_MOODS.find((m) => m.key === mood) ?? null;

/** One-tap emoji the thought composer offers (designs 1f / 2g). */
export const THOUGHT_EMOJIS = ["☕", "🔥", "😴", "🎧", "✈️", "🍜", "🎉", "💭"];

/** The audience choices shown - "Close" is designed but hidden for now. */
export const AUDIENCES: {
  key: EphemeralAudience;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { key: "public", label: "Public", desc: "Anyone on ChatterLoop", icon: "public" },
  { key: "connections", label: "Contacts", desc: "Only people in your contacts", icon: "group" },
];

export const audienceOf = (privacy: string | null | undefined) =>
  AUDIENCES.find((a) => a.key === privacy) ?? AUDIENCES[0];

type AnyEntity = IEntityRef | IFlexibleEntity | null | undefined;

/** "Mika Santos" - the name a card or header shows. */
export const entityName = (entity: AnyEntity): string => {
  const details = (entity as any)?.details;
  if (!details) return "";
  if (entity?.type === "user") {
    const full = `${details.first_name ?? ""} ${details.last_name ?? ""}`.trim();
    return full || (details.username ? `@${details.username}` : "");
  }
  return details.name || (details.slug ? `@${details.slug}` : "");
};

/** "Mika" - the short label under a rail avatar or on a board tile. */
export const entityFirstName = (entity: AnyEntity): string => {
  const details = (entity as any)?.details;
  if (entity?.type === "user" && details?.first_name) return details.first_name;
  return entityName(entity);
};

export const entityAvatar = (entity: AnyEntity): string | undefined => {
  const profile = (entity as any)?.details?.profile;
  return profile && profile !== "none" && profile !== "N/A" ? profile : undefined;
};

export const entityHandle = (entity: AnyEntity): string | undefined => {
  const details = (entity as any)?.details;
  return entity?.type === "user" ? details?.username : details?.slug;
};

/** "Hungry · 22h left" - the meta line under a thought bubble. */
export const thoughtMeta = (thought: { content: { mood?: ThoughtMood | null }; expires_at?: string | null }) =>
  [moodOf(thought.content.mood)?.label, timeLeftLabel(thought.expires_at)].filter(Boolean).join(" · ");

/**
 * Archived by hand while its 24h were not over: it can still come back to
 * the board (unarchive), until the moment it would have expired anyway.
 */
export const canUnarchive = (post: { is_archived?: boolean; expires_at?: string | null }) =>
  !!post.is_archived && !isExpired(post.expires_at);
