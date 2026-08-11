import { Avatar, Btn, Icon } from "@/reusables/design";
import { timeSince } from "@/reusables/hooks/reusable";
import { INotificationAction, INotificationV2 } from "@/reusables/vars/interfaces";
import {
  isRunnable,
  webActions,
  webRedirect,
} from "@/reusables/hooks/notificationActions";

// type -> small badge icon on the avatar (detail rows), per the mockup.
const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  post_reaction: { icon: "favorite", color: "var(--pink)" },
  post_comment: { icon: "mode_comment", color: "var(--green)" },
  tag_notification: { icon: "alternate_email", color: "var(--gold)" },
  shared_post_notification: { icon: "cached", color: "var(--brand)" },
  contact_request: { icon: "person_add", color: "var(--brand)" },
  follow: { icon: "person_add", color: "var(--green)" },
  follow_request: { icon: "lock_person", color: "var(--brand)" },
  info_contact_accept: { icon: "how_to_reg", color: "var(--green)" },
  info_contact_decline: { icon: "close", color: "var(--text-3)" },
  poke: { icon: "touch_app", color: "var(--gold)" },
};

interface NotificationRowProps {
  notification: INotificationV2;
  /** "column" = compact row inside a desktop section column / mobile
   *  preview; "detail" = larger row in the See-all view (adds the
   *  type-icon bubble and a border on read items), per the mockup. */
  size?: "column" | "detail";
  actionBusy: boolean;
  onAccept: (n: INotificationV2) => void;
  onDecline: (n: INotificationV2) => void;
  /** Runs a server-driven action. Absent = fall back to onAccept/onDecline. */
  onAction?: (n: INotificationV2, action: INotificationAction) => void;
  /** Row tap - only called when the server gave this client a destination. */
  onOpen?: (n: INotificationV2) => void;
}

function NotificationRow({
  notification: n,
  size = "column",
  actionBusy,
  onAccept,
  onDecline,
  onAction,
  onOpen,
}: NotificationRowProps) {
  const isDetail = size === "detail";
  const typeBadge = TYPE_ICONS[n.type] || {
    icon: "notifications",
    color: "var(--text-3)",
  };

  // Bold sender name + the stored sentence. The details text starts with
  // the sender's @handle ("@maria reacted ..."), so strip it when we can
  // show the real display name instead - graceful fallback otherwise.
  const senderName = n.fromUser?.display_name || n.content.headline;
  let details = n.content.details || "";
  if (n.fromUser?.handle) {
    details = details.replace(
      new RegExp(`^@${n.fromUser.handle}\\s+`, "i"),
      "",
    );
  }

  const timeLabel = n.date?.time
    ? `${n.date.date} · ${n.date.time}`
    : timeSince(n.date?.date);

  // Both request kinds are answered from this row. referenceStatus=false is
  // what marks one as still OPEN - the server writes it that way, and
  // accepting/declining flips it locally so the buttons drop away without a
  // refetch.
  // Server-driven buttons, filtered to web and to the kinds this client can
  // actually carry out. An unrunnable entry renders nothing rather than a
  // button that does nothing - that rule is what lets the server add an action
  // type without breaking already-deployed clients.
  const serverActions = onAction ? webActions(n).filter(isRunnable) : [];

  // The legacy path stays as a FALLBACK, not as the primary. It covers an older
  // server that sends no `actions`, and it is what makes this deployable before
  // the server change lands. Delete it once the server is out everywhere.
  const showLegacyActions =
    serverActions.length === 0 &&
    (n.type === "contact_request" || n.type === "follow_request") &&
    !n.referenceStatus;

  const destination = webRedirect(n);
  const isTappable = !!destination && !!onOpen;

  return (
    <div
      onClick={isTappable ? () => onOpen!(n) : undefined}
      role={isTappable ? "button" : undefined}
      tabIndex={isTappable ? 0 : undefined}
      onKeyDown={
        isTappable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen!(n);
              }
            }
          : undefined
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: isDetail ? 12 : 10,
        padding: isDetail ? 13 : 9,
        borderRadius: isDetail ? "var(--r-md)" : "var(--r-sm)",
        background: n.isRead ? "var(--surface)" : "var(--brand-soft)",
        border: isDetail
          ? `1px solid ${n.isRead ? "var(--border)" : "transparent"}`
          : "none",
        flex: "none",
        // Only when there is somewhere to go. A pointer over a row that does
        // nothing is a promise the row cannot keep.
        cursor: isTappable ? "pointer" : undefined,
      }}
    >
      <div style={{ position: "relative", flex: "none" }}>
        <Avatar
          id={n.fromUser?.entity_id || n.fromUserID}
          name={senderName}
          src={n.fromUser?.profile ?? undefined}
          size={isDetail ? 44 : 38}
        />
        {isDetail && (
          <span
            style={{
              position: "absolute",
              right: -3,
              bottom: -3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Icon n={typeBadge.icon} s={13} c={typeBadge.color} />
          </span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: isDetail ? 13.5 : 13,
          lineHeight: 1.35,
          textAlign: "left",
        }}
      >
        {/* The badge belongs to the NAME, so it sits immediately after it -
            trailing the whole sentence read as if it applied to the action.
            Nudged down a hair to sit on the text baseline. */}
        <span style={{ fontWeight: 700, color: "var(--text)" }}>
          {senderName}
        </span>
        {n.fromUser?.is_verified && (
          <span
            style={{
              display: "inline-flex",
              verticalAlign: "text-bottom",
              margin: "0 1px 0 3px",
            }}
          >
            <Icon n="verified" s={13} c="var(--brand)" />
          </span>
        )}{" "}
        <span style={{ color: "var(--text-2)" }}>{details}</span>
        <div
          style={{
            fontSize: isDetail ? 11.5 : 11,
            color: "var(--text-3)",
            marginTop: isDetail ? 3 : 2,
          }}
        >
          {timeLabel}
        </div>
      </div>
      {(serverActions.length > 0 || showLegacyActions) && (
        <div
          // Buttons must not also fire the row's destination.
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: "none",
          }}
        >
          {serverActions.length > 0
            ? serverActions.map((action) => (
                <Btn
                  key={`${action.id}-${action.order}`}
                  size="sm"
                  // `style` is a presentation hint from the server; anything
                  // unrecognised falls back to the neutral outline rather than
                  // guessing at emphasis.
                  variant={
                    action.style === "primary"
                      ? "primary"
                      : action.style === "danger"
                        ? "outline"
                        : "outline"
                  }
                  disabled={actionBusy}
                  onClick={() => onAction!(n, action)}
                >
                  {action.name}
                </Btn>
              ))
            : (
              <>
                <Btn size="sm" disabled={actionBusy} onClick={() => onAccept(n)}>
                  Confirm
                </Btn>
                <Btn
                  size="sm"
                  variant="outline"
                  disabled={actionBusy}
                  onClick={() => onDecline(n)}
                >
                  Decline
                </Btn>
              </>
            )}
        </div>
      )}
    </div>
  );
}

export default NotificationRow;
