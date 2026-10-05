/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Who is typing, from the `istyping_broadcast` SSE event.
 *
 * Since the broadcast carries the typer's identity (entityID, displayName,
 * profile, entityType - see /m/istypingbroadcast), an entry can name and draw
 * the person on its own. Older servers sent only the ACCOUNT `userID` and the
 * conversation, so every field below the key is optional and callers fall
 * back to the conversation's member list, then to "someone".
 *
 * The Flutter client builds the same label (lib/core/utils/typing_label.dart).
 */

export interface TypingEntry {
  conversationID: string;
  /** The ACCOUNT id - all an older server sends. */
  userID?: string;
  /** The acting ENTITY id; prefer it to `userID` wherever it is present. */
  entityID?: string | null;
  displayName?: string | null;
  profile?: string | null;
  entityType?: string | null;
  /** Stamped by the reducer, so an expiry timer only removes its own ping. */
  receivedAt?: number;
}

/** One typer per (person, conversation). */
export const typingKey = (entry: TypingEntry) =>
  `${entry.entityID || entry.userID || ""}|${entry.conversationID}`;

export const typersIn = (
  list: TypingEntry[] | undefined,
  conversationID: string,
): TypingEntry[] =>
  (list ?? []).filter((entry) => entry.conversationID === conversationID);

/**
 * The name a typer goes by in a label: a person's first name, the way group
 * threads label senders, and a page's or bot's whole name ("Neon Systems",
 * not "Neon").
 */
export const typerName = (entry: TypingEntry): string | null => {
  const name = (entry.displayName ?? "").trim();
  if (!name) return null;
  return entry.entityType && entry.entityType !== "user"
    ? name
    : name.split(/\s+/)[0];
};

/**
 * The conversation list's typing line. A DM's row is already titled with the
 * person, so it says only "is typing…"; a group or channel row says who.
 */
export const typingLabel = (
  typers: TypingEntry[],
  isGroupLike: boolean,
): string => {
  if (!isGroupLike) return "is typing…";
  if (typers.length > 1) return "multiple people are typing…";
  const name = typers[0] ? typerName(typers[0]) : null;
  return name ? `${name} is typing…` : "someone is typing…";
};
