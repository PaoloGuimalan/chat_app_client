/* eslint-disable @typescript-eslint/no-explicit-any */
import Feed from "../tabs/feed/Feed";

function DesktopHome() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "row",
        gap: 0,
      }}
    >
      {/* {showContactsRail && (
        <div
          style={{
            width: 320,
            flex: "none",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            borderRight: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <Contacts />
        </div>
      )} */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Feed />
      </div>
    </div>
  );
}

export default DesktopHome;
