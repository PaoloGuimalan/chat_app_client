import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Icon } from "@/reusables/design";
import { timeSince } from "@/reusables/hooks/reusable";
import {
  isRunnable,
  webActions,
  webRedirect,
} from "@/reusables/hooks/notificationActions";
import {
  INotificationAction,
  INotificationGroup,
  INotificationV2,
} from "@/reusables/vars/interfaces";
import NotificationRow from "./NotificationRow";
import "@/styles/styles.css";

/**
 * Several notifications of the same action on the same thing, as one row -
 * "Maya, Leo and 3 others reacted to your post" - that expands to the
 * notifications themselves. In Connections, one person's requests, accepts and
 * approvals: "Juan sent you a contact request and accepted your request".
 *
 * The server decides what groups (notificationgroups.js). A group's own row
 * NEVER carries buttons: every button stays on the member it belongs to,
 * answered there once expanded - two contact requests from one person are
 * two Confirms, each for its own connection. So a group holding something to
 * answer says so, and its row opens the group rather than leaving the page.
 */
interface GroupedNotificationRowProps {
  group: INotificationGroup;
  size?: "column" | "detail";
  expanded: boolean;
  onToggle: (key: string) => void;
  actionBusy: boolean;
  onAccept: (n: INotificationV2) => void;
  onDecline: (n: INotificationV2) => void;
  onAction?: (n: INotificationV2, action: INotificationAction) => void;
  onOpen?: (n: INotificationV2) => void;
}

const nameOf = (n: INotificationV2) =>
  n.fromUser?.display_name || n.content.headline || "Someone";

/** The distinct people in a group, newest first. */
const actorsOf = (items: INotificationV2[]) => {
  const seen = new Set<string>();
  const actors: INotificationV2[] = [];
  for (const n of items) {
    const id = n.fromUser?.entity_id || n.fromUserID;
    if (seen.has(id)) continue;
    seen.add(id);
    actors.push(n);
  }
  return actors;
};

/**
 * Where the group's own row goes when every member goes to the same place -
 * a post, give or take the comment it scrolls to. Reactions on a post open
 * the post; follows open five different profiles, so that row only expands.
 */
const sharedDestinationOf = (items: INotificationV2[]) => {
  if (items.length === 0) return null;
  const strip = (route: string) => route.split("#")[0].split("?")[0];
  const first = webRedirect(items[0]);
  if (!first?.route) return null;
  const base = strip(first.route);
  return items.every((n) => {
    const route = webRedirect(n)?.route;
    return !!route && strip(route) === base;
  })
    ? items[0]
    : null;
};

/**
 * Members still waiting on an answer - the same test NotificationRow uses to
 * show buttons, plus the open flag that answering flips locally.
 */
const answerableCount = (items: INotificationV2[]) =>
  items.filter(
    (n) =>
      !n.referenceStatus &&
      (webActions(n).some(isRunnable) ||
        n.type === "contact_request" ||
        n.type === "follow_request"),
  ).length;

function GroupedNotificationRow({
  group,
  size = "column",
  expanded,
  onToggle,
  actionBusy,
  onAccept,
  onDecline,
  onAction,
  onOpen,
}: GroupedNotificationRowProps) {
  const isDetail = size === "detail";
  const latest = group.items[0];
  const actors = actorsOf(group.items);
  const shown = actors.slice(0, group.actorCount >= 3 ? 2 : group.actorCount);
  const others = Math.max(0, group.actorCount - shown.length);
  const toAnswer = answerableCount(group.items);
  // Something inside to answer: the row opens the group, where the buttons
  // are, instead of going somewhere without them.
  const destination = toAnswer > 0 ? null : sharedDestinationOf(group.items);
  const unread = group.unread > 0;

  const timeLabel = latest?.date?.time
    ? `${latest.date.date} · ${latest.date.time}`
    : timeSince(latest?.date?.date);

  const toggle = () => onToggle(group.key);
  const openOrToggle = () => {
    if (destination && onOpen) onOpen(destination);
    else toggle();
  };

  const names = shown.map((n, i) => (
    <span key={n.notificationID}>
      {i > 0 && (i === shown.length - 1 && others === 0 ? " and " : ", ")}
      <span style={{ fontWeight: 700, color: "var(--text)" }}>{nameOf(n)}</span>
    </span>
  ));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: "none" }}>
      <div
        className="cl-notification-row"
        data-tappable="true"
        data-unread={unread ? "true" : "false"}
        onClick={openOrToggle}
        role="button"
        tabIndex={0}
        aria-expanded={destination ? undefined : expanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openOrToggle();
          }
        }}
        style={{
          display: "flex",
          alignItems: "start",
          gap: isDetail ? 12 : 10,
          padding: isDetail ? 13 : 9,
          borderRadius: isDetail ? "var(--r-md)" : "var(--r-sm)",
          background: unread ? "var(--brand-soft)" : "var(--surface)",
          border: isDetail
            ? `1px solid ${unread ? "transparent" : "var(--border)"}`
            : "none",
        }}
      >
        {/* Two faces, the second tucked behind the first - the group's
            people at a glance, in the space of one avatar and a bit. */}
        <div
          style={{
            position: "relative",
            flex: "none",
            width: (isDetail ? 44 : 38) + (actors.length > 1 ? 12 : 0),
            height: isDetail ? 44 : 38,
          }}
        >
          {actors.slice(0, 2).reverse().map((n, i, arr) => {
            const front = i === arr.length - 1;
            const faceSize = isDetail ? (front ? 38 : 34) : front ? 32 : 30;
            return (
              <div
                key={n.notificationID}
                style={{
                  position: "absolute",
                  left: front ? 0 : 12,
                  top: front ? (actors.length > 1 ? 6 : 0) : 0,
                  borderRadius: "50%",
                  boxShadow: front ? "0 0 0 2px var(--surface)" : undefined,
                }}
              >
                <Avatar
                  id={n.fromUser?.entity_id || n.fromUserID}
                  name={nameOf(n)}
                  src={n.fromUser?.profile ?? undefined}
                  kind={n.fromUser?.type}
                  size={actors.length > 1 ? faceSize : isDetail ? 44 : 38}
                />
              </div>
            );
          })}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: isDetail ? "var(--fs-body)" : "var(--fs-body-sm)",
            lineHeight: 1.35,
            textAlign: "left",
          }}
        >
          {names}
          {others > 0 && (
            <>
              {" and "}
              <span style={{ fontWeight: 700, color: "var(--text)" }}>
                {others} {others === 1 ? "other" : "others"}
              </span>
            </>
          )}{" "}
          <span style={{ color: "var(--text-2)" }}>{group.action}</span>
          <div
            style={{
              fontSize: "var(--fs-meta)",
              color: "var(--text-3)",
              marginTop: isDetail ? 3 : 2,
            }}
          >
            {timeLabel}
            {group.actorCount < group.count && ` · ${group.count} notifications`}
            {toAnswer > 0 && (
              <span className="cl-notification-group-answer">
                {" · "}
                {toAnswer} to answer
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="cl-notification-group-toggle"
          aria-label={expanded ? "Collapse" : `Show all ${group.count}`}
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <span className="cl-notification-group-toggle__count">
            {group.count}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex" }}
          >
            <Icon n="expand_more" s={18} c="var(--text-2)" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          // Height only on this box; the spacing is on the box inside it - the
          // same rule as the composer strips (ComposerStrip.tsx): animating
          // height and padding together made framer measure short and snap.
          <motion.div
            key="members"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="cl-notification-group-members">
              {group.items.map((n) => (
                <NotificationRow
                  key={n.notificationID}
                  notification={n}
                  size="column"
                  actionBusy={actionBusy}
                  onAccept={onAccept}
                  onDecline={onDecline}
                  onAction={onAction}
                  onOpen={onOpen}
                />
              ))}
              {group.count > group.items.length && (
                <div className="cl-notification-group-more">
                  and {group.count - group.items.length} earlier
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GroupedNotificationRow;
