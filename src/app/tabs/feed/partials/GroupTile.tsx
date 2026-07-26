import { Avatar, Icon } from "@/reusables/design";
import { GroupShortcut } from "@/reusables/vars/interfaces";

interface GroupTileProps {
  group: GroupShortcut;
  onOpen: (group: GroupShortcut) => void;
}

// Rounded-square tile for the Contacts page's group chat rail. These are
// shortcuts into conversations, so the fallback badge is the group-chat
// icon rather than a generic realm glyph.
function GroupTile({ group, onOpen }: GroupTileProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(group)}
      title={group.display_name}
      style={{
        flex: "none",
        width: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <div style={{ position: "relative", width: 60, height: 60 }}>
        {group.profile ? (
          <Avatar
            id={group.realm_id}
            name={group.display_name}
            src={group.profile}
            size={60}
            style={{ borderRadius: 18 }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "var(--brand-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon n="groups" s={28} c="var(--brand)" />
          </div>
        )}
        {/* Kind marker - reads as "this is a group chat" at a glance. */}
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
          <Icon n="forum" s={12} c="var(--brand)" />
        </span>
      </div>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 650,
          textAlign: "center",
          color: "var(--text)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 110,
        }}
      >
        {group.display_name}
      </div>
    </button>
  );
}

export default GroupTile;
