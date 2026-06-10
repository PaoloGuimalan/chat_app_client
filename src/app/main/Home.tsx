/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/styles.css";
import ChatterLoopLogo from "../../assets/imgs/chatterloop.png";
import DefaultProfile from "../../assets/imgs/default.png";
import { useDispatch, useSelector } from "react-redux";
import {
  AiOutlineSearch,
  AiOutlineLogout,
} from "react-icons/ai";
import { FiMoon, FiSun } from "react-icons/fi";
import { RiSettings3Line } from "react-icons/ri";
import {
  ActiveContactsRequest,
  // BroadcastCoordinatesRequest,
  GetFeedEmojisRequest,
  InitConversationListRequest,
  LogoutRequest,
  NotificationInitRequest,
} from "../../reusables/hooks/requests";
import Contacts from "../tabs/feed/Contacts";
import Notifications from "../tabs/feed/Notifications";
import Messages from "../tabs/feed/Messages";
import {
  SSENotificationsTRequest,
  CloseSSENotifications,
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
// import CallCollection from "../absolutes/calls/CallCollection";
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
import CachedImage from "../reusables/cachers/CachedImage";
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
import SearchScreen from "../tabs/search/Search";
import { desktopNavigation, mobileNavigation } from "./navigation";

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

  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("cl_up_theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cl_up_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const unreadMessagesCount = useMemo(() => {
    return messageslist.reduce((total: number, message: any) => total + (message.unread || 0), 0);
  }, [messageslist]);

  const currentSection = useMemo(() => {
    if (currentPathname.startsWith("/search")) return "search";
    if (currentPathname.startsWith("/mapfeed")) return "map";
    if (currentPathname.startsWith("/messages")) return "messages";
    if (currentPathname.startsWith("/contacts")) return "contacts";
    if (currentPathname.startsWith("/servers")) return "servers";
    if (currentPathname.startsWith("/notifications")) return "notifications";
    if (currentPathname.startsWith("/settings")) return "settings";
    if (currentPathname.startsWith("/user")) return "profile";
    if (currentPathname.startsWith("/realms")) return "realms";
    return "feed";
  }, [currentPathname]);

  const shellTitles: Record<string, string> = {
    feed: "Home",
    search: "Explore",
    map: "Map",
    messages: "Messages",
    contacts: "Contacts",
    servers: "Servers",
    notifications: "Activity",
    settings: "Settings",
    profile: "Profile",
    realms: "Realm",
  };

  useEffect(() => {
    setNextPath(null);
  }, []);

  const notificationslist = useSelector(
    (state: any) => state.notificationslist,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const istypinglist = useSelector((state: any) => state.istypinglist);
  const pagemodal: IPageModal = useSelector((state: any) => state.pagemodal);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    istypinglist.map((mp: any) => {
      setTimeout(() => {
        dispatch({
          type: SET_REMOVE_IS_TYPING_LIST,
          payload: {
            istyping: mp,
          },
        });
      }, 4000);
    });
  }, [istypinglist]);

  const clearStates = () => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: {
        conversationsetup: conversationsetupstate,
      },
    });

    dispatch({
      type: SET_MESSAGES_LIST_OVERRIDE,
      payload: {
        messageslist: [],
      },
    });

    dispatch({
      type: SET_CLEAR_ALERTS,
      payload: {
        alerts: [],
      },
    });

    dispatch({
      type: SET_CALLS_LIST,
      payload: {
        callslist: [],
      },
    });

    dispatch({
      type: CLEAR_PENDING_CALL_ALERTS,
      payload: {
        clearstate: [],
      },
    });

    dispatch({
      type: SET_CONTACTS_LIST_OVERRIDE,
      payload: {
        contactslist: contactsliststate,
      },
    });

    dispatch({
      type: SET_MINIMIZED_CONVERSATION_OVERRIDE,
      payload: {
        conversations: [],
      },
    });

    dispatch({
      type: SET_NOTIFICATIONS_LIST_OVERRIDE,
      payload: {
        notficationslist: { list: [], totalunread: 0 },
      },
    });
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
        payload: {
          messageslist: response.conversationslist,
        },
      });
      // setisLoading(false);
    });
    NotificationInitRequest(1, 10, dispatch, () => {});
    ActiveContactsRequest(dispatch);
    GetFeedEmojisRequest()
      .then((response) => {
        dispatch({
          type: SET_EMOJIS_LIST,
          payload: {
            emojis: response,
          },
        });
      })
      .catch((err) => {
        console.log(err);
      });

    initPushNotification();
  };

  const initPushNotification = () => {
    try {
      if (
        Notification.permission === "denied" ||
        Notification.permission === "default"
      ) {
        Notification.requestPermission().then((_) => {
          //check if granted after allow
        });
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

  const logoutProcess = () => {
    clearStates();
    CloseSSENotifications();
    LogoutRequest(dispatch);
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
            // BroadcastCoordinatesRequest(payload).catch((err) => {
            //   console.log(err);
            // });
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

          // dispatch({
          //   type: SET_COORDINATES,
          //   payload: {
          //     coordinates: rawInitialCoordinates,
          //   },
          // });

          dispatch({
            type: SET_RAW_COORDINATES,
            payload: {
              rawcoordinates: rawInitialCoordinates,
            },
          });
        },
        null,
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
        },
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

          // dispatch({
          //   type: SET_COORDINATES,
          //   payload: {
          //     coordinates: rawWatchCoordinates,
          //   },
          // });

          dispatch({
            type: SET_RAW_COORDINATES,
            payload: {
              rawcoordinates: rawWatchCoordinates,
            },
          });
        },
        null,
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
        },
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
        .then(() => {
          console.log("Connected Map Socket");
        })
        .catch((err) => {
          console.log(err);
        });
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
      dispatch({
        type: SET_COORDINATES,
        payload: {
          coordinates: {
            referenceID: authentication.user.userID,
            label: authentication.user.username,
            longitude: 120.9842,
            latitude: 14.5995,
            heading: -17.6,
            speed: 0,
            mode: null,
            type: "profile",
          },
        },
      });

      dispatch({
        type: SET_RAW_COORDINATES,
        payload: {
          rawcoordinates: {
            referenceID: authentication.user.userID,
            label: authentication.user.username,
            longitude: 120.9842,
            latitude: 14.5995,
            heading: -17.6,
            speed: 0,
            mode: null,
            type: "profile",
          },
        },
      });
    }
  }, [authentication.user]);

  return (
    <div className="cl-app-shell">
      <CallContainer />

      {!isMobileView && (
        <aside className="cl-rail">
          <button
            type="button"
            className="cl-rail-btn"
            onClick={onClickHome}
            title="Home"
            data-active={currentSection === "feed"}
          >
            <img src={ChatterLoopLogo} alt="ChatterLoop" style={{ width: 30, height: 30 }} />
          </button>

          <div className="cl-rail-stack">
            {desktopNavigation.map((item) => {
              const Icon = item.icon;
              const active =
                currentSection === item.key ||
                (item.path !== "/" && currentPathname.startsWith(item.path));
              return (
                <button
                  key={item.key}
                  type="button"
                  className="cl-rail-btn"
                  data-active={active}
                  title={item.label}
                  onClick={() => {
                    if (item.key === "messages" && screensizelistener.W <= 900) {
                      dispatch({
                        type: SET_CONVERSATION_SETUP,
                        payload: {
                          conversationsetup: conversationsetupstate,
                        },
                      });
                    }

                    navigate(item.path);
                  }}
                >
                  <Icon size={24} />
                  {(item.key === "messages" && unreadMessagesCount > 0) ||
                  (item.key === "notifications" && notificationslist.totalunread > 0) ? (
                    <span
                      className="span_icon_counts"
                      style={{
                        position: "absolute",
                        top: 7,
                        right: 8,
                      }}
                    >
                      {item.key === "messages"
                        ? unreadMessagesCount
                        : notificationslist.totalunread}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="cl-rail-footer">
            <button
              type="button"
              className="cl-rail-btn"
              title="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <FiSun size={22} /> : <FiMoon size={22} />}
            </button>
            <button
              type="button"
              className="cl-rail-btn"
              title="Settings"
              data-active={currentSection === "settings"}
              onClick={() => navigate("/settings")}
            >
              <RiSettings3Line size={22} />
            </button>
            <button
              type="button"
              className="cl-rail-btn"
              title="Logout"
              onClick={logoutProcess}
            >
              <AiOutlineLogout size={22} />
            </button>
            <button
              type="button"
              className="cl-rail-avatar"
              title="Profile"
              onClick={() => navigate(`/${authentication.user.username}`)}
            >
              {authentication.user.profile !== "none" ? (
                <CachedImage
                  src={authentication.user.profile}
                  id="img_actual_profile"
                />
              ) : (
                <CachedImage src={DefaultProfile} id="img_default_profile" />
              )}
            </button>
          </div>
        </aside>
      )}

      <div className="cl-main-shell">
        {isMobileView && (
          <header className="cl-mobile-topbar">
            <button
              type="button"
              className="cl-shell-icon-btn"
              onClick={() => navigate(`/${authentication.user.username}`)}
              style={{ width: 34, height: 34, borderRadius: "50%" }}
            >
              {authentication.user.profile !== "none" ? (
                <CachedImage
                  src={authentication.user.profile}
                  id="img_actual_profile"
                />
              ) : (
                <CachedImage src={DefaultProfile} id="img_default_profile" />
              )}
            </button>
            <h1 className="cl-mobile-topbar-title">
              {shellTitles[currentSection] || "ChatterLoop"}
            </h1>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <button
                type="button"
                className="cl-shell-icon-btn"
                onClick={() => navigate("/search")}
              >
                <AiOutlineSearch size={22} />
              </button>
              <button
                type="button"
                className="cl-shell-icon-btn"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              <button
                type="button"
                className="cl-shell-icon-btn"
                onClick={logoutProcess}
                title="Logout"
              >
                <AiOutlineLogout size={20} />
              </button>
            </div>
          </header>
        )}

        <main className="cl-main-scroller">
          <div className="cl-shell-page cl-fade">
            <Routes>
              <Route
                path="/"
                element={<DesktopHome />}
              />
              <Route path="/search" element={<SearchScreen />} />
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
              <Route path="/mapfeed" element={<MapFeed />} />
              <Route path="/servers/*" element={<Servers />} />
              <Route path="/pages/*" element={<Pages />} />
            </Routes>
          </div>
        </main>

        {isMobileView && (
          <nav className="cl-mobile-nav">
            {mobileNavigation.map((item) => {
              const Icon = item.icon;
              const active =
                currentSection === item.key ||
                (item.path !== "/" && currentPathname.startsWith(item.path));
              const badgeValue =
                item.key === "messages"
                  ? unreadMessagesCount
                  : item.key === "notifications"
                    ? notificationslist.totalunread
                    : 0;

              return (
                <button
                  key={item.key}
                  type="button"
                  className="cl-mobile-nav-btn"
                  data-active={active}
                  onClick={() => {
                    if (item.key === "messages") {
                      dispatch({
                        type: SET_CONVERSATION_SETUP,
                        payload: {
                          conversationsetup: conversationsetupstate,
                        },
                      });
                    }

                    navigate(item.path);
                  }}
                >
                  <Icon size={26} />
                  {badgeValue > 0 ? (
                    <span
                      className="span_icon_counts"
                      style={{
                        position: "absolute",
                        top: 6,
                        right: "50%",
                        marginRight: -18,
                      }}
                    >
                      {badgeValue}
                    </span>
                  ) : null}
                  <span
                    className="cl-mobile-nav-dot"
                    style={{ background: active ? "var(--cl-brand)" : "transparent" }}
                  />
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {!isMobileView && minimizedconversation.length > 0 && (
        <div className="tw-z-[100] tw-absolute tw-bottom-0 tw-left-0 tw-flex tw-gap-[10px] tw-p-[0px] tw-pl-[10px]">
          {minimizedconversation.map((mp: any) => (
            <div
              className="tw-flex tw-h-[500px] tw-max-h-[600px] tw-w-[330px] tw-max-w-[330px]"
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

export default Home;
