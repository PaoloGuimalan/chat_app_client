import { Card, Icon } from "@/reusables/design";

function MessagesDefault() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card
        pad={28}
        style={{
          width: "min(420px, 100%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 14px",
            borderRadius: "50%",
            background: "var(--brand-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon n="forum" s={30} c="var(--brand)" />
        </div>
        <div
          style={{
            fontSize: "var(--fs-heading)",
            fontWeight: 800,
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          Messages
        </div>
        <div style={{ color: "var(--text-2)", lineHeight: 1.5 }}>
          Select a conversation from the list to open the thread here.
        </div>
      </Card>
    </div>
  );
}

export default MessagesDefault;
