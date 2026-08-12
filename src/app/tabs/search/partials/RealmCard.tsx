import { Avatar, Btn, Card, Icon } from "@/reusables/design";
import RealmCardReportButton from "@/app/widgets/items/RealmCardReportButton";
import { SearchRealmResult } from "@/reusables/vars/interfaces";
import {
  gradFor,
  REALM_TYPE_ICON,
  REALM_TYPE_LABEL,
  realmReachLabel,
} from "./searchShared";

interface RealmCardProps {
  realm: SearchRealmResult;
  followBusy: boolean;
  joinBusy: boolean;
  onToggleFollow: (realm: SearchRealmResult) => void;
  /** Card click - Search decides the destination per realm type. */
  onOpen: (realm: SearchRealmResult) => void;
  onJoinGroup: (realm: SearchRealmResult) => void;
  /** Rail mode pins the mockup's fixed 200px width; grid mode fills its cell. */
  rail?: boolean;
}

// Realm card per the redesign mockup: gradient banner (hashed off the entity
// id, realm profile photo overlaid when set), name, "Type · reach" line, and
// one action per type - page: Follow/Following toggle; server: Open (routes
// to /servers/:realmID); group: Join (one-click, public groups only) or, once
// a member, Open chat (routes to /messages/:conversationID).
function RealmCard({
  realm,
  followBusy,
  joinBusy,
  onToggleFollow,
  onOpen,
  onJoinGroup,
  rail,
}: RealmCardProps) {
  const [gradA, gradB] = gradFor(realm.entity_id);
  const isPage = realm.realm_type === "page";

  return (
    <Card
      pad={0}
      hover
      style={{
        width: rail ? 200 : "100%",
        flex: rail ? "none" : undefined,
        overflow: "hidden",
        // Anchors the corner report button to the card, not the page.
        position: "relative",
      }}
    >
      <RealmCardReportButton
        targetId={realm.entity_id}
        realmType={realm.realm_type}
      />
      <button
        type="button"
        onClick={() => onOpen(realm)}
        style={{
          width: "100%",
          height: 74,
          border: "none",
          padding: 0,
          cursor: "pointer",
          background: `linear-gradient(135deg, ${gradA}, ${gradB})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {realm.profile ? (
          <Avatar
            id={realm.entity_id}
            name={realm.display_name}
            src={realm.profile}
            size={44}
            shape="rounded"
            style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.65)" }}
          />
        ) : (
          <Icon
            n={REALM_TYPE_ICON[realm.realm_type] || "public"}
            s={30}
            c="#fff"
          />
        )}
      </button>
      <div style={{ padding: "10px 12px" }}>
        <button
          type="button"
          onClick={() => onOpen(realm)}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            maxWidth: "100%",
            color: "inherit",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "var(--fs-title)",
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {realm.display_name}
          </span>
          {realm.is_verified && (
            <Icon
              n="verified"
              s={14}
              c="var(--brand)"
              style={{ flex: "none" }}
            />
          )}
        </button>
        <div
          style={{
            fontSize: "var(--fs-caption)",
            color: "var(--text-3)",
            margin: "2px 0 8px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {REALM_TYPE_LABEL[realm.realm_type] || realm.realm_type} ·{" "}
          {realmReachLabel(realm)}
        </div>
        {isPage ? (
          <Btn
            block
            size="sm"
            variant={realm.is_follower ? "soft" : "primary"}
            disabled={followBusy}
            onClick={() => onToggleFollow(realm)}
          >
            {realm.is_follower ? "Following" : "Follow"}
          </Btn>
        ) : realm.realm_type === "server" ? (
          <Btn block size="sm" variant="soft" onClick={() => onOpen(realm)}>
            Open
          </Btn>
        ) : realm.is_member ? (
          <Btn
            block
            size="sm"
            variant="soft"
            iconL="forum"
            onClick={() => onOpen(realm)}
          >
            Open chat
          </Btn>
        ) : (
          <Btn
            block
            size="sm"
            variant="primary"
            disabled={joinBusy}
            onClick={() => onJoinGroup(realm)}
          >
            Join
          </Btn>
        )}
      </div>
    </Card>
  );
}

export default RealmCard;

