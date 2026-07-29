import { Avatar, Btn, Card, Icon } from "@/reusables/design";
import { SearchPersonResult } from "@/reusables/vars/interfaces";

interface PersonCardProps {
  person: SearchPersonResult;
  online: boolean;
  followBusy: boolean;
  onToggleFollow: (person: SearchPersonResult) => void;
  onOpen: (person: SearchPersonResult) => void;
  /** Rail mode pins the mockup's fixed 168px width; grid mode fills its cell. */
  rail?: boolean;
}

// People card per the redesign mockup: centered avatar (+ online dot), name,
// mutual-connection count, Follow/Following toggle.
function PersonCard({
  person,
  online,
  followBusy,
  onToggleFollow,
  onOpen,
  rail,
}: PersonCardProps) {
  return (
    <Card
      pad={16}
      hover
      style={{
        width: rail ? 168 : "100%",
        flex: rail ? "none" : undefined,
        textAlign: "center",
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(person)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          margin: "0 auto 10px",
          cursor: "pointer",
          display: "block",
        }}
      >
        <Avatar
          id={person.entity_id}
          name={person.display_name}
          src={person.profile ?? undefined}
          size={56}
          online={online}
        />
      </button>
      <button
        type="button"
        onClick={() => onOpen(person)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          margin: "0 auto",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          {person.display_name}
        </span>
        {person.is_verified && (
          <Icon n="verified" s={15} c="var(--brand)" style={{ flex: "none" }} />
        )}
      </button>
      <div
        style={{
          fontSize: "var(--fs-caption)",
          color: "var(--text-3)",
          margin: "2px 0 10px",
        }}
      >
        {person.mutual_count} mutual
      </div>
      <Btn
        block
        size="sm"
        variant={person.is_followed ? "soft" : "primary"}
        disabled={followBusy}
        onClick={() => onToggleFollow(person)}
      >
        {person.is_followed ? "Following" : "Follow"}
      </Btn>
    </Card>
  );
}

export default PersonCard;
