/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The "unread messages" divider: where reading stopped when the reader
 * opened the conversation.
 *
 * Kept in step with the app's lib/core/utils/unread_divider.dart - the same
 * rules, so a thread splits at the same message on both clients.
 *
 * WHY A FIRST-SIGHT SNAPSHOT
 * --------------------------
 * Unread is not something the thread can just be asked: opening it marks
 * what scrolls into view as seen, the server confirms, the thread refetches -
 * and a divider computed from live `seeners` would vanish a second after it
 * appeared. So each message's status is recorded the FIRST time this visit
 * sees it, and never revised.
 *
 * Messages that arrive while the reader is looking are not unread in any
 * sense worth a divider; they are recorded as neutral. Older pages loaded by
 * scrolling up ARE judged - they were sitting there unread all along.
 */

export type FirstSight = "unread" | "read" | "neutral";

export interface UnreadVisit {
  sight: Map<string, FirstSight>;
  /** The visit's first load has been recorded. */
  loaded: boolean;
}

export const newUnreadVisit = (): UnreadVisit => ({
  sight: new Map(),
  loaded: false,
});

/**
 * Read if you sent it or are among its seeners - under ANY of your ids: the
 * personal entity, the entity you are acting as, and the account id older
 * seeners were recorded with. A system line or a deleted message is neither.
 */
export const firstSightOf = (message: any, selfIds: Set<string>): FirstSight => {
  if (String(message?.messageType ?? "").includes("notif")) return "neutral";
  if (message?.isDeleted) return "neutral";
  if (selfIds.has(String(message?.sender))) return "read";
  const seeners: any[] = Array.isArray(message?.seeners) ? message.seeners : [];
  return seeners.some((id) => selfIds.has(String(id))) ? "read" : "unread";
};

/**
 * Records every message this visit has not seen before. `list` is
 * newest-first. Once the first load is in, a message newer than everything
 * already recorded arrived live - neutral; one older than what is recorded
 * came in with an older page - judged.
 */
export const recordFirstSight = (
  list: any[],
  visit: UnreadVisit,
  selfIds: Set<string>,
) => {
  let passedKnown = false;
  for (const message of list) {
    const id = String(message?.messageID ?? "");
    if (!id) continue;
    if (visit.sight.has(id)) {
      passedKnown = true;
      continue;
    }
    visit.sight.set(
      id,
      visit.loaded && !passedKnown ? "neutral" : firstSightOf(message, selfIds),
    );
  }
  visit.loaded = true;
};

export interface UnreadDivider {
  /** The OLDEST unread message - the divider sits right above it. */
  messageID: string;
  /** Unread messages below the divider. */
  count: number;
}

/**
 * Walks back from the newest message over the unread ones until the first
 * read one: the divider goes between the two. Neutral messages are
 * transparent. Null when nothing was unread - or when the walk runs off the
 * loaded messages while older pages remain, because then the boundary is
 * further back, and it appears once that page loads rather than in the
 * wrong place now.
 */
export const unreadDividerOf = (
  list: any[],
  visit: UnreadVisit,
  hasOlder: boolean,
): UnreadDivider | null => {
  let oldestUnread = "";
  let count = 0;
  for (const message of list) {
    const id = String(message?.messageID ?? "");
    const sight = visit.sight.get(id);
    if (sight === "unread") {
      oldestUnread = id;
      count += 1;
    } else if (sight === "read") {
      return count > 0 ? { messageID: oldestUnread, count } : null;
    }
  }
  if (hasOlder || count === 0) return null;
  // The whole conversation is loaded and every message is unread.
  return { messageID: oldestUnread, count };
};

export const unreadDividerLabel = (count: number) =>
  `${count} unread message${count === 1 ? "" : "s"}`;
