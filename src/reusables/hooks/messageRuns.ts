/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Message RUNS - consecutive messages from one sender, drawn as a single block
 * in group-like conversations: the sender's name goes on the FIRST message of
 * the run and their avatar beside the LAST, and every message in it is
 * indented to line up with the others.
 *
 * The Flutter client makes the same call (lib/core/utils/message_runs.dart)
 * and the two must stay in step, or the same thread groups differently on web
 * and on the phone.
 */

/**
 * A pause this long from the same sender starts a new run, so a message
 * picked back up after a break carries its name and avatar again instead of
 * reading as part of a conversation that ended a while ago.
 */
export const RUN_BREAK_GAP_MS = 10 * 60 * 1000;

/**
 * A message's timestamp in ms, or null when it cannot be read. Messages from
 * the server carry an ISO string; the older `{ date, time }` shape is still
 * produced by a few local paths, so both are accepted.
 */
export const messageTimeMs = (messageDate: any): number | null => {
  if (!messageDate) return null;
  const raw =
    typeof messageDate === "object" && messageDate.date
      ? `${messageDate.date}${messageDate.time ? ` ${messageDate.time}` : ""}`
      : messageDate;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? null : ms;
};

const isSystemLine = (message: any) =>
  String(message?.messageType ?? "").includes("notif");

/**
 * Whether `message` opens a new run, given the message drawn directly ABOVE
 * it (the next older one), or nothing when it is the oldest one loaded.
 *
 * A run breaks when the sender changes, when a system line ("X joined") sits
 * between the two, or after a pause of RUN_BREAK_GAP_MS. A deleted message
 * still belongs to its sender's run - it is that person's message, just gone.
 */
export const startsSenderRun = (message: any, older: any): boolean => {
  if (!older) return true;
  if (isSystemLine(older)) return true;
  if (String(older.sender) !== String(message?.sender)) return true;

  const at = messageTimeMs(message?.messageDate);
  const olderAt = messageTimeMs(older.messageDate);
  if (at !== null && olderAt !== null && at - olderAt > RUN_BREAK_GAP_MS) {
    return true;
  }
  return false;
};

/**
 * Whether `message` closes its run, given the message drawn directly BELOW it
 * (the next newer one), or nothing when it is the newest one loaded. The same
 * rule read from the other side: a run ends wherever the next one starts.
 */
export const endsSenderRun = (message: any, newer: any): boolean =>
  !newer || startsSenderRun(newer, message);

/**
 * Where each member's "seen" avatar sits: under the NEWEST message they have
 * seen, keyed by messageID, in a newest-first list.
 *
 * EVERY seener gets exactly one avatar except the viewer - `selfIDs`, which
 * should hold both the personal entity and the one being acted as, since a
 * seen is recorded against whichever was acting. That includes the sender:
 * they have seen what they wrote, and the server lists them as a seener of it
 * (counted here too, for older messages stored without that).
 *
 * Walks newest to oldest and places each entity the first time it turns up,
 * so the avatar follows whoever has read furthest down. System lines are
 * skipped as anchors - nobody "reads" a join notice.
 *
 * `canonical` maps an id to the one a person is known by. Older messages
 * recorded seeners by ACCOUNT id (the server's commented-out `seeners: userID`
 * lines), and without folding those onto the entity id one member would get
 * two avatars - and the viewer could appear as a seener of their own thread.
 */
export const seenAvatarAnchors = (
  newestFirst: any[],
  selfIDs: (string | null | undefined)[],
  canonical: (id: string) => string = (id) => id,
): Map<string, string[]> => {
  const anchors = new Map<string, string[]>();
  const placed = new Set<string>(
    selfIDs
      .filter((id): id is string => !!id)
      .map((id) => canonical(String(id))),
  );

  for (const message of newestFirst) {
    if (isSystemLine(message) || !message?.messageID) continue;
    for (const raw of [...(message.seeners ?? []), message.sender]) {
      if (raw === null || raw === undefined || raw === "") continue;
      const id = canonical(String(raw));
      if (placed.has(id)) continue;
      placed.add(id);
      const list = anchors.get(message.messageID) ?? [];
      list.push(id);
      anchors.set(message.messageID, list);
    }
  }
  return anchors;
};
