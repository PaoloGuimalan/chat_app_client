/* eslint-disable @typescript-eslint/no-explicit-any */
import { InitServerListRequest } from "@/reusables/hooks/requests";
import { useCallback, useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Default from "./partials/Default";
import Channels from "./partials/Channels";
import { useSelector } from "react-redux";
import { Avatar, Icon, useTheme } from "@/reusables/design";
import { useWakeLock } from "react-screen-wake-lock";

function Servers() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const urllocation = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const authentication = useSelector((state: any) => state.authentication);

  const [serverlist, setserverlist] = useState<any[]>([]);
  const [isLoaded, setisLoaded] = useState<boolean>(false);

  // The skeleton delay is for the FIRST load only. A live refetch replaces the
  // rail in place - flashing five placeholders because somebody joined a server
  // would be the update announcing itself louder than the thing it updated.
  const loadServerList = useCallback((initial: boolean) => {
    InitServerListRequest()
      .then((response) => {
        setserverlist(response);
        if (initial) {
          setTimeout(() => setisLoaded(true), 1000);
        } else {
          setisLoaded(true);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    loadServerList(true);
  }, [loadServerList]);

  // The rail is MY servers, so it moves whenever my membership does - joining
  // from the directory or from Explore, being added by an admin, leaving, being
  // removed, or any of those happening on another device. None of that used to
  // reach this list: it was fetched once on mount and never again, so a server
  // you had just joined only appeared after a full reload.
  //
  // Refetched rather than patched: the event carries ids, not the name and photo
  // the rail draws.
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail?.event !== "realm_membership_changed") return;
      // Servers only - the same event covers groups and channels, which are not
      // in this rail.
      if (detail.realmType && detail.realmType !== "server") return;
      // Everyone still in the realm is told as well, so their member lists can
      // move; their rail did not change.
      const me = authentication?.active_entity_context?.id;
      const entityIDs: string[] = detail.entityIDs ?? [];
      if (me && entityIDs.length > 0 && !entityIDs.includes(String(me))) return;

      loadServerList(false);
    };

    document.addEventListener("server-events-relay", handler as EventListener);
    return () => {
      document.removeEventListener(
        "server-events-relay",
        handler as EventListener,
      );
    };
  }, [authentication, loadServerList]);

  // Keeps the screen from sleeping anywhere in the servers page, so a
  // running visualizer/audio capture doesn't get interrupted by the device
  // dimming or locking.
  const {
    isSupported: isWakeLockSupported,
    released: isWakeLockReleased,
    request: requestWakeLock,
    release: releaseWakeLock,
  } = useWakeLock({
    onRequest: () => {},
    onError: () => {},
    onRelease: () => {},
  });
  useEffect(() => {
    if (isWakeLockSupported) {
      requestWakeLock();
    }

    return () => {
      if (!isWakeLockReleased) {
        releaseWakeLock();
      }
    };
  }, [isWakeLockSupported, requestWakeLock, releaseWakeLock, isWakeLockReleased]);

  const isMobile = screensizelistener.W <= 900;
  const isInsideServer = urllocation.pathname.split("/").length >= 4;
  const railHidden = isMobile && isInsideServer;

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "row",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: railHidden ? 0 : 76,
          minWidth: railHidden ? 0 : 76,
          flex: "none",
          overflowX: "hidden",
          overflowY: "auto",
          background: "var(--surface-2)",
          borderRight: railHidden ? "none" : "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: railHidden ? 0 : "12px 0",
          gap: 6,
          transition: "width .2s var(--ease)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          title="Back"
          style={railIconButton}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--surface-hover)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Icon n="arrow_back" s={22} c="var(--gold)" />
        </button>
        <button
          onClick={() => navigate("/servers")}
          title="All servers"
          style={railIconButton}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--surface-hover)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Icon n="dns" s={22} c="var(--gold)" />
        </button>
        <div
          style={{
            width: "60%",
            height: 1,
            background: "var(--border)",
            margin: "4px 0 4px",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            width: "100%",
          }}
        >
          {isLoaded
            ? serverlist.map((mp: any) => {
                const active = urllocation.pathname.includes(mp.serverID);
                return (
                  <button
                    key={mp.serverID}
                    onClick={() => navigate(`/servers/${mp.serverID}`)}
                    title={mp.serverName}
                    style={{
                      width: 42,
                      height: 42,
                      flex: "none",
                      border: "none",
                      background: active ? "var(--gold-soft)" : "transparent",
                      cursor: "pointer",
                      borderRadius: active ? "var(--r-md)" : "50%",
                      transition:
                        "border-radius .18s var(--spring), background .16s",
                      padding: 0,
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      if (!active)
                        e.currentTarget.style.background = "var(--surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Avatar
                      name={mp.serverName}
                      src={mp.profile && mp.profile !== "N/A" ? mp.profile : null}
                      size={42}
                      shape="circle"
                    />
                  </button>
                );
              })
            : Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 42,
                    height: 42,
                    flex: "none",
                    borderRadius: "50%",
                    background: "var(--surface-3)",
                    animation: "clPulse 1.4s var(--ease) infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
        </div>
      </div>
      <Routes>
        <Route path="/" element={<Default />} />
        <Route path="/:serverID/*" element={<Channels />} />
      </Routes>
      <style>{pulseKeyframes}</style>
    </div>
  );
}

const railIconButton = {
  width: 48,
  height: 48,
  flex: "none",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  borderRadius: "var(--r-md)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

const pulseKeyframes = `
@keyframes clPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`;

export default Servers;
