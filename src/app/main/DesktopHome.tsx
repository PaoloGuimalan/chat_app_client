/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSelector } from "react-redux";
import Notifications from "../tabs/feed/Notifications";
import Messages from "../tabs/feed/Messages";
import Feed from "../tabs/feed/Feed";
import Contacts from "../tabs/feed/Contacts";

function DesktopHome({ togglerightwidget }: { togglerightwidget: string }) {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const showRightPanel = screensizelistener.W > 900;
  const showContactsRail = screensizelistener.W >= 1280;

  let rightPanel = null;
  if (showRightPanel) {
    rightPanel =
      togglerightwidget === "notifs" ? <Notifications /> : <Messages />;
  }

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
      {showContactsRail && (
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
      )}
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
      {rightPanel && (
        <div
          style={{
            width: 360,
            flex: "none",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            borderLeft: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          {rightPanel}
        </div>
      )}
    </div>
  );
}

export default DesktopHome;
