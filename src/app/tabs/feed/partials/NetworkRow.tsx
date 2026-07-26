import { Avatar, Btn, Card, Icon, IconBtn } from "@/reusables/design";
import { NetworkEntityResult } from "@/reusables/vars/interfaces";

export type NetworkRowKind = "connection" | "follower" | "following";

interface NetworkRowProps {
  item: NetworkEntityResult;
  kind: NetworkRowKind;
  /** Users only - pages are never "active now". */
  online?: boolean;
  /**
   * Presence label from the active-sessions state: "Active now" when online,
   * otherwise how long ago the last session was ("5 minutes ago"). Null when
   * unknown, or always for pages.
   */
  presence?: string | null;
  busy?: boolean;
  onOpen: (item: NetworkEntityResult) => void;
  onMessage?: (item: NetworkEntityResult) => void;
  onToggleFollow?: (item: NetworkEntityResult) => void;
}

// One row for all three people-ish sections of the redesigned Contacts page.
// The card is identical across sections; only the trailing action differs -
// message for a connection, Follow back/Following for a follower, Unfollow
// for someone you follow.
function NetworkRow({
  item,
  kind,
  online,
  presence,
  busy,
  onOpen,
  onMessage,
  onToggleFollow,
}: NetworkRowProps) {
  const isRealm = item.type === "realm";

  // Connections show mutuals (the metric that makes a person recognisable);
  // follow rows show the handle, since a mutual count is not what you're
  // scanning for there. Presence is appended when known, so a row reads
  // "214 mutual · Active now".
  const base =
    kind === "connection"
      ? `${item.mutual_count ?? 0} mutual`
      : `@${item.handle}`;
  const subtitle = presence ? `${base} · ${presence}` : base;

  const renderAction = () => {
    if (kind === "connection") {
      return (
        <IconBtn
          n="forum"
          title="Message"
          onClick={() => onMessage?.(item)}
          style={{ color: "var(--brand)", background: "var(--surface-2)" }}
        />
      );
    }

    if (kind === "follower") {
      const followsBack = !!item.is_followed_back;
      return (
        <Btn
          size="sm"
          variant={followsBack ? "soft" : "primary"}
          disabled={busy}
          onClick={() => onToggleFollow?.(item)}
        >
          {followsBack ? "Following" : "Follow back"}
        </Btn>
      );
    }

    return (
      <Btn
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onToggleFollow?.(item)}
      >
        Unfollow
      </Btn>
    );
  };

  return (
    <Card
      pad={10}
      hover
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
      }}
    >
      <div style={{ position: "relative", flex: "none" }}>
        <Avatar
          id={item.entity_id}
          name={item.display_name}
          src={item.profile ?? undefined}
          size={42}
        />
        {online && (
          <span
            style={{
              position: "absolute",
              right: -1,
              bottom: -1,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "var(--green)",
              border: "2px solid var(--surface)",
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => onOpen(item)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            color: "inherit",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 13.5,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.display_name}
          </span>
          {item.is_verified && (
            <Icon n="verified" s={14} c="var(--brand)" style={{ flex: "none" }} />
          )}
          {isRealm && (
            <span title="Page" style={{ display: "inline-flex", flex: "none" }}>
              <Icon n="flag" s={13} c="var(--text-3)" />
            </span>
          )}
        </button>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "left",
          }}
        >
          {subtitle}
        </div>
      </div>

      <div style={{ flex: "none" }}>{renderAction()}</div>
    </Card>
  );
}

export default NetworkRow;
