/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo } from "react";
import ChatterLoopImg from "../../assets/imgs/chatterloop.png";
import ChatterLoopDarkImg from "../../assets/imgs/chatterloop-dark.png";
import { useDispatch, useSelector } from "react-redux";
import {
  ActiveContactsRequest,
  GetFeedEmojisRequest,
  InitConversationListRequest,
  LogoutRequest,
  NotificationInitRequest,
} from "../../reusables/hooks/requests";
import Contacts from "../tabs/feed/Contacts";
import Notifications from "../tabs/feed/Notifications";
import Messages from "../tabs/feed/Messages";
import {
  CloseSSENotifications,
  SSENotificationsTRequest,
} from "../../reusables/hooks/sse";
import {
  CLEAR_PENDING_CALL_ALERTS,
  SET_CALLS_LIST,
  SET_CLEAR_ALERTS,
  SET_CONTACTS_LIST_OVERRIDE,
  SET_CONVERSATION_SETUP,
  SET_COORDINATES,
  SET_EMOJIS_LIST,
  SET_MESSAGES_LIST,
  SET_MESSAGES_LIST_OVERRIDE,
  SET_MINIMIZED_CONVERSATION_OVERRIDE,
  SET_NOTIFICATIONS_LIST_OVERRIDE,
  SET_RAW_COORDINATES,
  SET_REMOVE_IS_TYPING_LIST,
  SET_USER_SETTINGS,
} from "../../redux/types";
import {
  contactsliststate,
  conversationsetupstate,
  usersettingsstate,
} from "../../redux/actions/states";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import DesktopHome from "./DesktopHome";
import { endSocket } from "../../reusables/hooks/sockets";
import MapFeed from "../tabs/mapfeed/MapFeed";
import { useLocation } from "react-router-dom";
import {
  AuthenticationInterface,
  ICoordinatesAnchor,
  IPageModal,
  IUserSettings,
} from "@/reusables/vars/interfaces";
import Servers from "../tabs/servers/Servers";
import UserMenu from "../tabs/profile/user/UserMenu";
import Conversation from "../tabs/messenger/Conversation";
import Settings from "../tabs/settings/Settings";
import Modal from "../reusables/Modal";
import ProfileContainer from "../tabs/profile/ProfileContainer";
import {
  getSettings,
  persistSettings,
} from "@/reusables/hooks/localforagehelper";
import { isUserSettingsComplete } from "@/reusables/hooks/reusable";
import {
  endMapSocket,
  socketMapConnect,
  socketSendCoordinatesBroadcast,
} from "@/reusables/hooks/mapsocket";
import CallContainer from "../absolutes/calls_v2/CallContainer";
import Pages from "../tabs/pages/Pages";
import RealmContainer from "../tabs/realms/RealmContainer";
import SearchPage from "../tabs/search/Search";
import { Avatar, Icon, useTheme } from "@/reusables/design";

interface RailItem {
  key: string;
  icon: string;
  label: string;
  onClick: () => void;
  isActive: boolean;
  badge?: number;
}

function Home({ setNextPath }: { setNextPath: (path: string | null) => void }) {
  const location = useLocation();

  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const messageslist = useSelector((state: any) => state.messageslist);
  const minimizedconversation = useSelector(
    (state: any) => state.minimizedconversation,
  );

  const activeuserslist = useSelector((state: any) => state.activeuserslist);

  const usersettings: IUserSettings = useSelector(
    (state: any) => state.usersettings,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const currentPathname = location.pathname;

  useEffect(() => {
    setNextPath(null);
  }, []);

  const isMapFeedMobileView = useMemo(() => {
    const isMapView = currentPathname.includes("mapfeed");
    return isMobileView && isMapView;
  }, [isMobileView, currentPathname]);

  const notificationslist = useSelector(
    (state: any) => state.notificationslist,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const istypinglist = useSelector((state: any) => state.istypinglist);
  const pagemodal: IPageModal = useSelector((state: any) => state.pagemodal);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    istypinglist.map((mp: any) => {
      setTimeout(() => {
        dispatch({
          type: SET_REMOVE_IS_TYPING_LIST,
          payload: { istyping: mp },
        });
      }, 4000);
    });
  }, [istypinglist]);

  const clearStates = () => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: { conversationsetup: conversationsetupstate },
    });
    dispatch({
      type: SET_MESSAGES_LIST_OVERRIDE,
      payload: { messageslist: [] },
    });
    dispatch({ type: SET_CLEAR_ALERTS, payload: { alerts: [] } });
    dispatch({ type: SET_CALLS_LIST, payload: { callslist: [] } });
    dispatch({
      type: CLEAR_PENDING_CALL_ALERTS,
      payload: { clearstate: [] },
    });
    dispatch({
      type: SET_CONTACTS_LIST_OVERRIDE,
      payload: { contactslist: contactsliststate },
    });
    dispatch({
      type: SET_MINIMIZED_CONVERSATION_OVERRIDE,
      payload: { conversations: [] },
    });
    dispatch({
      type: SET_NOTIFICATIONS_LIST_OVERRIDE,
      payload: { notficationslist: { list: [], totalunread: 0 } },
    });
  };

  const logoutProcess = () => {
    clearStates();
    CloseSSENotifications();
    LogoutRequest(dispatch);
  };

  useEffect(() => {
    initEventSources();
    return () => {
      clearStates();
      endSocket();
      endMapSocket();
    };
  }, []);

  const initEventSources = () => {
    SSENotificationsTRequest(dispatch, alerts, authentication);
    InitConversationListRequest(1, 10).then((response) => {
      dispatch({
        type: SET_MESSAGES_LIST,
        payload: { messageslist: response.conversationslist },
      });
    });
    NotificationInitRequest(1, 10, dispatch, () => {});
    ActiveContactsRequest(dispatch);
    GetFeedEmojisRequest()
      .then((response) => {
        dispatch({
          type: SET_EMOJIS_LIST,
          payload: { emojis: response },
        });
      })
      .catch((err) => console.log(err));
    initPushNotification();
  };

  const initPushNotification = () => {
    try {
      if (
        Notification.permission === "denied" ||
        Notification.permission === "default"
      ) {
        Notification.requestPermission().then(() => {});
      }
    } catch (ex) {
      console.log(ex);
    }
  };

  const onClickHome = () => {
    if (location.pathname === "/") {
      const localListener = new CustomEvent("broadcast_reload_feed", {
        detail: true,
      });
      window.dispatchEvent(localListener);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    if (authentication.user.userID) {
      getSettings(authentication.user.userID).then((res) => {
        if (res) {
          if (isUserSettingsComplete(res)) {
            dispatch({
              type: SET_USER_SETTINGS,
              payload: { usersettings: res },
            });
          } else {
            persistSettings(authentication.user.userID, usersettingsstate);
          }
        } else {
          persistSettings(authentication.user.userID, usersettingsstate);
        }
      });
    }
  }, [authentication.user.userID]);

  const shareLocationProcess = useCallback(
    (myLocation: ICoordinatesAnchor) => {
      if (usersettings.map_feed_access.share_location) {
        const toShareCoordinates = myLocation;
        if (toShareCoordinates) {
          toShareCoordinates.mode = {
            currentMode: usersettings.map_feed_access.current_mode,
            ifSpeedShown: usersettings.map_feed_access.toggleSpeed,
          };
          const filteredActiveContacts = activeuserslist
            .filter((flt: any) => flt.sessionStatus)
            .map((item: any) => item._id);
          const payload = {
            coordinates: toShareCoordinates,
            receivers: filteredActiveContacts,
          };
          if (filteredActiveContacts.length > 0) {
            socketSendCoordinatesBroadcast({
              ...payload,
              userID: authentication.user.userID,
              label: authentication.user.username,
            });
          }
        }
      }
    },
    [usersettings.map_feed_access, activeuserslist, authentication.user],
  );

  useEffect(() => {
    let watchID: any;
    if (authentication.user && usersettings.map_feed_access.enable_location) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const rawInitialCoordinates = {
            referenceID: authentication.user.userID,
            label: authentication.user.username,
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            heading: position.coords.heading,
            speed: position.coords.speed ?? 0,
            mode: null,
            type: "profile",
          };
          shareLocationProcess(rawInitialCoordinates);
          dispatch({
            type: SET_RAW_COORDINATES,
            payload: { rawcoordinates: rawInitialCoordinates },
          });
        },
        null,
        { enableHighAccuracy: true, maximumAge: 1000 },
      );
      watchID = navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
          const rawWatchCoordinates = {
            referenceID: authentication.user.userID,
            label: authentication.user.username,
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            heading: position.coords.heading,
            speed: position.coords.speed ?? 0,
            mode: null,
            type: "profile",
          };
          shareLocationProcess(rawWatchCoordinates);
          dispatch({
            type: SET_RAW_COORDINATES,
            payload: { rawcoordinates: rawWatchCoordinates },
          });
        },
        null,
        { enableHighAccuracy: true, maximumAge: 1000 },
      );
    }
    return () => {
      navigator.geolocation.clearWatch(watchID);
    };
  }, [authentication.user, usersettings.map_feed_access, activeuserslist]);

  useEffect(() => {
    if (
      usersettings.map_feed_access.enable_location &&
      usersettings.map_feed_access.share_location
    ) {
      socketMapConnect()
        .then(() => console.log("Connected Map Socket"))
        .catch((err) => console.log(err));
    }
    return () => {
      endMapSocket();
    };
  }, [
    authentication.user.userID,
    usersettings.map_feed_access.enable_location,
    usersettings.map_feed_access.share_location,
  ]);

  useEffect(() => {
    if (authentication.user) {
      const baseCoord = {
        referenceID: authentication.user.userID,
        label: authentication.user.username,
        longitude: 120.9842,
        latitude: 14.5995,
        heading: -17.6,
        speed: 0,
        mode: null,
        type: "profile",
      };
      dispatch({ type: SET_COORDINATES, payload: { coordinates: baseCoord } });
      dispatch({
        type: SET_RAW_COORDINATES,
        payload: { rawcoordinates: baseCoord },
      });
    }
  }, [authentication.user]);

  const totalUnreadMessages = useMemo(() => {
    if (messageslist.length === 0) return 0;
    return messageslist
      .map((m: any) => m.unread || 0)
      .reduce((a: number, b: number) => a + b, 0);
  }, [messageslist]);

  const totalUnreadNotifs = notificationslist.totalunread || 0;
  const onProfileClick = () => {
    if (screensizelistener.W <= 1100) {
      navigate("/user");
    } else {
      navigate(`/${authentication.user.username}`);
    }
  };

  const railItems: RailItem[] = [
    {
      key: "home",
      icon: "home",
      label: "Home",
      isActive: location.pathname === "/",
      onClick: onClickHome,
    },
    {
      key: "explore",
      icon: "search",
      label: "Explore",
      isActive: location.pathname.startsWith("/explore"),
      onClick: () => navigate("/explore"),
    },
    {
      key: "map",
      icon: "map",
      label: "Map",
      isActive: location.pathname.startsWith("/mapfeed"),
      onClick: () => navigate("/mapfeed"),
    },
    {
      key: "contacts",
      icon: "contacts",
      label: "Contacts",
      isActive: location.pathname.startsWith("/contacts"),
      onClick: () => navigate("/contacts"),
    },
    {
      key: "messages",
      icon: "forum",
      label: "Messages",
      isActive: location.pathname.startsWith("/messages"),
      onClick: () => navigate("/messages"),
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
    },
    {
      key: "notifs",
      icon: "notifications",
      label: "Activity",
      isActive: location.pathname.startsWith("/notifications"),
      onClick: () => navigate("/notifications"),
      badge: totalUnreadNotifs > 0 ? totalUnreadNotifs : undefined,
    },
    {
      key: "servers",
      icon: "dns",
      label: "Servers",
      isActive: location.pathname.startsWith("/servers"),
      onClick: () => navigate("/servers"),
    },
    {
      key: "pages",
      icon: "menu_book",
      label: "Pages",
      isActive: location.pathname.startsWith("/pages"),
      onClick: () => navigate("/pages"),
    },
  ];

  const mobileNavItems = railItems.filter((it) =>
    ["home", "contacts", "map", "servers", "pages"].includes(it.key),
  );
  const mobileNavOrder = ["home", "contacts", "map", "servers", "pages"];
  const orderedMobileNavItems = mobileNavOrder
    .map((key) => mobileNavItems.find((item) => item.key === key))
    .filter((item): item is RailItem => Boolean(item));

  const showRail = !isMobileView && !isMapFeedMobileView;
  const showMobileNav = isMobileView && !isMapFeedMobileView;
  const isSettings = location.pathname.startsWith("/settings");

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "row",
        background:
          "radial-gradient(1200px 600px at 70% -10%, var(--bg-grad-a), var(--bg-grad-b))",
      }}
    >
      <CallContainer />

      {showRail && (
        <Rail
          items={railItems}
          theme={theme}
          toggleTheme={toggleTheme}
          isSettings={isSettings}
          onSettings={() => navigate("/settings")}
          onLogout={logoutProcess}
          onProfile={onProfileClick}
          profileSrc={
            authentication.user.profile !== "none"
              ? authentication.user.profile
              : undefined
          }
          profileName={authentication.user.fullName?.firstName}
        />
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
        }}
      >
        {showMobileNav && (
          <MobileTopBar
            onProfile={onProfileClick}
            onExplore={() => navigate("/explore")}
            onMessages={() => navigate("/messages")}
            onNotifications={() => navigate("/notifications")}
            profileSrc={
              authentication.user.profile !== "none"
                ? authentication.user.profile
                : undefined
            }
            profileName={authentication.user.fullName?.firstName}
            theme={theme}
            toggleTheme={toggleTheme}
            messagesBadge={
              totalUnreadMessages > 0 ? totalUnreadMessages : undefined
            }
            notificationsBadge={
              totalUnreadNotifs > 0 ? totalUnreadNotifs : undefined
            }
          />
        )}

        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Routes>
              <Route path="/" element={<DesktopHome />} />
              <Route path="/:userID/*" element={<ProfileContainer />} />
              <Route path="/realms/*" element={<RealmContainer />} />
              <Route path="/settings" element={<Settings isModal={false} />} />
              <Route
                path="/user"
                element={
                  screensizelistener.W <= 1100 ? (
                    <UserMenu />
                  ) : (
                    <Navigate to={"/"} />
                  )
                }
              />
              <Route path="/messages" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/explore" element={<SearchPage />} />
              <Route path="/mapfeed" element={<MapFeed />} />
              <Route path="/servers/*" element={<Servers />} />
              <Route path="/pages/*" element={<Pages />} />
            </Routes>
          </div>
        </main>

        {!(screensizelistener.W <= 900) && minimizedconversation.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 10,
              display: "flex",
              flexDirection: "row-reverse",
              gap: 10,
              zIndex: 100,
              justifyContent: "flex-end",
            }}
          >
            {minimizedconversation.map((mp: any) => (
              <div
                style={{
                  width: 330,
                  height: 500,
                  maxHeight: 600,
                  maxWidth: 330,
                  display: "flex",
                }}
                key={mp.conversationid}
              >
                <Conversation
                  conversationsetup={mp}
                  theme={{ primary: "#1c7def", lighten: "#82b7f6" }}
                  isMinimized={true}
                />
              </div>
            ))}
          </div>
        )}

        {showMobileNav && <MobileNav items={orderedMobileNavItems} />}
      </div>

      {screensizelistener.W >= 1100 && pagemodal && (
        <Modal
          component={
            <div className="div_page_modal_container">
              {pagemodal.component}
            </div>
          }
        />
      )}
    </div>
  );
}

function Rail({
  items,
  theme,
  toggleTheme,
  isSettings,
  onSettings,
  onLogout,
  onProfile,
  profileSrc,
  profileName,
}: {
  items: RailItem[];
  theme: string;
  toggleTheme: () => void;
  isSettings: boolean;
  onSettings: () => void;
  onLogout: () => void;
  onProfile: () => void;
  profileSrc?: string;
  profileName?: string;
}) {
  void profileName;

  const homeIcon = theme === "dark" ? ChatterLoopDarkImg : ChatterLoopImg;

  return (
    <nav
      className="cl-main-rail"
      style={{
        width: "var(--rail-w)",
        flex: "none",
        height: "100%",
        minHeight: 0,
        background: "var(--rail)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0 14px",
        gap: 6,
        zIndex: 2,
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--r-md)",
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <img
          src={homeIcon}
          alt="ChatterLoop"
          style={{
            width: 32,
            height: 32,
            objectFit: "contain",
          }}
        />
      </div>
      <div
        className="cl-main-rail__items"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
          alignItems: "center",
        }}
      >
        {items.map((item) => {
          const on = item.isActive;
          return (
            <button
              key={item.key}
              className="cl-main-rail__item"
              title={item.label}
              onClick={item.onClick}
              style={{
                position: "relative",
                width: 48,
                height: 48,
                borderRadius: "var(--r-md)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: on ? "var(--rail-active-bg)" : "transparent",
                color: on ? "var(--rail-icon-active)" : "var(--rail-icon)",
                transition: "background .16s var(--ease), color .16s",
              }}
              onMouseEnter={(e) => {
                if (!on)
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                if (!on) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon n={item.icon} s={24} />
              {item.badge ? (
                <span
                  style={{
                    position: "absolute",
                    top: 7,
                    right: 8,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    background: "var(--pink)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--brand-600)",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <button
        className="cl-main-rail__action"
        title="Toggle theme"
        onClick={toggleTheme}
        style={railBtnStyle}
      >
        <Icon n={theme === "dark" ? "light_mode" : "dark_mode"} s={22} />
      </button>
      <button
        className="cl-main-rail__action"
        title="Settings"
        onClick={onSettings}
        style={{
          ...railBtnStyle,
          color: isSettings ? "#fff" : "var(--rail-icon)",
          background: isSettings ? "rgba(255,255,255,0.15)" : "transparent",
        }}
      >
        <Icon n="settings" s={22} />
      </button>
      <button
        className="cl-main-rail__action"
        title="Logout"
        onClick={onLogout}
        style={railBtnStyle}
      >
        <Icon n="logout" s={22} />
      </button>
      <button
        className="cl-main-rail__profile"
        title="Profile"
        onClick={onProfile}
        style={{
          marginTop: 4,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          borderRadius: "50%",
        }}
      >
        <Avatar
          id={profileName}
          name={profileName}
          src={profileSrc}
          size={38}
        />
      </button>
    </nav>
  );
}

const railBtnStyle = {
  width: 44,
  height: 44,
  borderRadius: "var(--r-sm)",
  border: "none",
  background: "transparent",
  color: "var(--rail-icon)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background .14s",
} as const;

function MobileTopBar({
  onProfile,
  onExplore,
  onMessages,
  onNotifications,
  profileSrc,
  profileName,
  theme,
  toggleTheme,
  messagesBadge,
  notificationsBadge,
}: {
  onProfile: () => void;
  onExplore: () => void;
  onMessages: () => void;
  onNotifications: () => void;
  profileSrc?: string;
  profileName?: string;
  theme: string;
  toggleTheme: () => void;
  messagesBadge?: number;
  notificationsBadge?: number;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        height: "var(--header-h)",
        flex: "none",
        padding: "0 14px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        zIndex: 2,
      }}
    >
      <button
        onClick={onProfile}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          borderRadius: "50%",
        }}
      >
        <Avatar
          id={profileName}
          name={profileName}
          src={profileSrc}
          size={36}
        />
      </button>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: "none",
        }}
      >
        <TopBarAction onClick={onExplore} icon="search" label="Search" />
        <TopBarAction
          onClick={onMessages}
          icon="forum"
          label="Messages"
          badge={messagesBadge}
        />
        <TopBarAction
          onClick={onNotifications}
          icon="notifications"
          label="Notifications"
          badge={notificationsBadge}
        />
        <TopBarAction
          onClick={toggleTheme}
          icon={theme === "dark" ? "light_mode" : "dark_mode"}
          label="Toggle mode"
        />
      </div>
    </header>
  );
}

function TopBarAction({
  onClick,
  icon,
  label,
  badge,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 38,
        height: 38,
        flex: "none",
        borderRadius: "var(--r-sm)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer",
        color: "var(--text-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Icon n={icon} s={18} />
      {badge ? (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            background: "var(--pink)",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--surface)",
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function MobileNav({ items }: { items: RailItem[] }) {
  return (
    <nav
      style={{
        display: "flex",
        height: "var(--bottomnav-h)",
        flex: "none",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 0,
      }}
    >
      {items.map((it) => {
        const on = it.isActive;
        return (
          <button
            key={it.key}
            onClick={it.onClick}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              color: on ? "var(--brand)" : "var(--text-3)",
              position: "relative",
            }}
          >
            <Icon n={it.icon} s={24} />
            {it.badge ? (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: "50%",
                  marginRight: -18,
                  minWidth: 15,
                  height: 15,
                  padding: "0 4px",
                  background: "var(--pink)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {it.badge}
              </span>
            ) : null}
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: on ? "var(--brand)" : "transparent",
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}

export default Home;

