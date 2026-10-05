/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Message RUNS - consecutive messages from one sender, drawn as a single block
 * in group-like conversations: the sender's avatar and name go on the FIRST
 * message of the run, and the rest are indented to line up under it.
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
