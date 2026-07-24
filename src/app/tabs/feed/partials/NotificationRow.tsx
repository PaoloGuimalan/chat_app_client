import { Avatar, Btn, Icon } from "@/reusables/design";
import { timeSince } from "@/reusables/hooks/reusable";
import { INotificationV2 } from "@/reusables/vars/interfaces";

// type -> small badge icon on the avatar (detail rows), per the mockup.
const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  post_reaction: { icon: "favorite", color: "var(--pink)" },
  post_comment: { icon: "mode_comment", color: "var(--green)" },
  tag_notification: { icon: "alternate_email", color: "var(--gold)" },
  shared_post_notification: { icon: "cached", color: "var(--brand)" },
  contact_request: { icon: "person_add", color: "var(--brand)" },
  follow: { icon: "person_add", color: "var(--green)" },
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
}

function NotificationRow({
  notification: n,
  size = "column",
  actionBusy,
  onAccept,
  onDecline,
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

  const showActions = n.type === "contact_request" && !n.referenceStatus;

  return (
    <div
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
        <span style={{ fontWeight: 700, color: "var(--text)" }}>
          {senderName}
        </span>{" "}
        <span style={{ color: "var(--text-2)" }}>{details}</span>
        {n.fromUser?.is_verified && (
          <span style={{ display: "inline-flex", marginLeft: 4 }}>
            <Icon n="verified" s={13} c="var(--brand)" />
          </span>
        )}
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
      {showActions && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: "none",
          }}
        >
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
        </div>
      )}
    </div>
  );
}

export default NotificationRow;
