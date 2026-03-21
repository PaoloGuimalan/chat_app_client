/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/styles.css";
import DefaultProfile from "../../assets/imgs/default.png";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  AiOutlineSearch,
  AiOutlineHome,
  AiOutlineMessage,
  AiOutlineBell,
  AiOutlineLogout,
} from "react-icons/ai";
import { FiMap } from "react-icons/fi";
import { RiContactsBook2Line } from "react-icons/ri";
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
import SearchMiniDrawer from "../widgets/SearchMiniDrawer";
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
  SET_TOGGLE_RIGHT_WIDGET,
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

function Home({ setNextPath }: { setNextPath: (path: string | null) => void }) {
  const location = useLocation();

  const togglerightwidget = useSelector(
    (state: any) => state.togglerightwidget,
  );
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
  // const [togglerightwidget, settogglerightwidget] = useState("notifs")

  const [searchBoxFocus, setsearchBoxFocus] = useState(false);
  const [searchbox, setsearchbox] = useState("");

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
        payload: {
          messageslist: response,
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

  const settogglerightwidget = (toggle: any) => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: {
        conversationsetup: conversationsetupstate,
      },
    });
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload: {
        togglerightwidget: toggle,
      },
    });
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
            // BroadcastCoordinatesRequest(payload).catch((err) => {
            //   console.log(err);
            // });
            socketSendCoordinatesBroadcast({
              ...payload,
              userID: authentication.user.userID,
            });
          }
        }
      }
    },
    [usersettings.map_feed_access, activeuserslist, authentication.user.userID],
  );

  useEffect(() => {
    let watchID: any;
    if (
      authentication.user.userID &&
      usersettings.map_feed_access.enable_location
    ) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const rawInitialCoordinates = {
            referenceID: authentication.user.userID,
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
  }, [
    authentication.user.userID,
    usersettings.map_feed_access,
    activeuserslist,
  ]);

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
    if (authentication.user.userID) {
      dispatch({
        type: SET_COORDINATES,
        payload: {
          coordinates: {
            referenceID: authentication.user.userID,
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
  }, [authentication.user.userID]);

  return (
    <div id="div_home">
      {/* <CallCollection /> */}
      <CallContainer />
      <div id="div_home_navigations" className="tw-z-[1] tw-border-[0px]">
        <div id="div_profile_search_container">
          {isMapFeedMobileView ? (
            <motion.button
              whileHover={{
                backgroundColor: "#e6e6e6",
              }}
              onClick={onClickHome}
              className="btn_navigations"
            >
              <AiOutlineHome style={{ fontSize: "25px", color: "#4A4A4A" }} />
            </motion.button>
          ) : (
            <motion.div
              whileHover={{
                backgroundColor: "#e6e6e6",
              }}
              onClick={() => {
                if (screensizelistener.W <= 1100) {
                  navigate("/user");
                } else {
                  navigate(`/${authentication.user.userID}`);
                }
              }}
              id="img_profile_container"
            >
              {authentication.user.profile !== "none" ? (
                <div id="img_default_profile_container">
                  <CachedImage
                    src={authentication.user.profile}
                    id="img_actual_profile"
                  />
                </div>
              ) : (
                <div id="img_default_profile_container">
                  <CachedImage src={DefaultProfile} id="img_default_profile" />
                </div>
              )}
              <span id="span_user_firstname_label">
                {authentication.user.fullName.firstName}
              </span>
            </motion.div>
          )}
          <div id="div_search_container">
            <div id="div_input_container">
              <AiOutlineSearch style={{ fontSize: "20px", color: "#4A4A4A" }} />
              <input
                value={searchbox}
                autoComplete="off"
                onChange={(e) => {
                  setsearchbox(e.target.value);
                }}
                onFocus={() => {
                  setsearchBoxFocus(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setsearchBoxFocus(false);
                  }, 500);
                }}
                type="text"
                placeholder="Search something..."
                id="input_search_box"
              />
            </div>
          </div>
          {isMapFeedMobileView && (
            <motion.button
              initial={{
                color: "#4A4A4A",
              }}
              whileHover={{
                backgroundColor: "#ff6675",
                color: "white",
              }}
              onClick={() => {
                logoutProcess();
              }}
              className="btn_navigations"
            >
              <AiOutlineLogout style={{ fontSize: "25px" }} />
            </motion.button>
          )}
        </div>
        {!isMapFeedMobileView && (
          <div id="div_buttons_navigation">
            <motion.button
              whileHover={{
                backgroundColor: "#e6e6e6",
              }}
              onClick={onClickHome}
              className="btn_navigations"
            >
              <AiOutlineHome style={{ fontSize: "25px", color: "#4A4A4A" }} />
            </motion.button>
            <motion.button
              whileHover={{
                backgroundColor: "#e6e6e6",
              }}
              onClick={() => {
                navigate("/mapfeed");
              }}
              className="btn_navigations"
            >
              <FiMap style={{ fontSize: "22px", color: "#4A4A4A" }} />
            </motion.button>
            {screensizelistener.W <= 1100 && (
              <motion.button
                whileHover={{
                  backgroundColor: "#e6e6e6",
                }}
                onClick={() => {
                  navigate("/contacts");
                }}
                className="btn_navigations"
              >
                <RiContactsBook2Line
                  style={{ fontSize: "25px", color: "#4A4A4A" }}
                />
              </motion.button>
            )}
            <motion.button
              whileHover={{
                backgroundColor: "#e6e6e6",
              }}
              onClick={() => {
                if (screensizelistener.W <= 900) {
                  dispatch({
                    type: SET_CONVERSATION_SETUP,
                    payload: {
                      conversationsetup: conversationsetupstate,
                    },
                  });
                  navigate("/messages");
                } else {
                  settogglerightwidget("messages");
                }
              }}
              className="btn_navigations"
            >
              {messageslist.length > 0 &&
                messageslist
                  .map((msgs: any) => msgs.unread)
                  .reduce((prev: any, next: any) => prev + next) > 0 && (
                  <span className="span_icon_counts">
                    {messageslist
                      .map((msgs: any) => msgs.unread)
                      .reduce((prev: any, next: any) => prev + next)}
                  </span>
                )}
              <AiOutlineMessage
                style={{ fontSize: "25px", color: "#4A4A4A" }}
              />
            </motion.button>
            <motion.button
              whileHover={{
                backgroundColor: "#e6e6e6",
              }}
              onClick={() => {
                if (screensizelistener.W <= 900) {
                  dispatch({
                    type: SET_CONVERSATION_SETUP,
                    payload: {
                      conversationsetup: conversationsetupstate,
                    },
                  });
                  navigate("/notifications");
                } else {
                  settogglerightwidget("notifs");
                }
              }}
              className="btn_navigations"
            >
              {notificationslist.totalunread > 0 && (
                <span className="span_icon_counts">
                  {notificationslist.totalunread}
                </span>
              )}
              <AiOutlineBell style={{ fontSize: "25px", color: "#4A4A4A" }} />
            </motion.button>
            <motion.button
              initial={{
                color: "#4A4A4A",
              }}
              whileHover={{
                backgroundColor: "#ff6675",
                color: "white",
              }}
              onClick={() => {
                logoutProcess();
              }}
              className="btn_navigations"
            >
              <AiOutlineLogout style={{ fontSize: "25px" }} />
            </motion.button>
          </div>
        )}
      </div>
      {searchBoxFocus && (
        <SearchMiniDrawer
          searchbox={searchbox}
          setsearchBoxFocus={setsearchBoxFocus}
        />
      )}
      {!(screensizelistener.W <= 900) && (
        <div className="tw-z-[100] tw-absolute tw-bottom-0 tw-bg-transparent tw-left-0 tw-h-auto tw-p-[0px] tw-pl-[10px] tw-flex -row tw-gap-[10px]">
          {minimizedconversation.map((mp: any) => {
            return (
              <div
                className="tw-w-[330px] tw-h-[500px] tw-max-h-[600px] tw-max-w-[330px] tw-flex"
                key={mp.conversationid}
              >
                <Conversation
                  conversationsetup={mp}
                  theme={{ primary: "#1c7def", lighten: "#82b7f6" }}
                  isMinimized={true}
                />
              </div>
            );
          })}
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
      <Routes>
        <Route
          path="/"
          element={<DesktopHome togglerightwidget={togglerightwidget} />}
        />
        <Route path="/:userID/*" element={<ProfileContainer />} />
        <Route path="/settings" element={<Settings isModal={false} />} />
        <Route
          path="/user"
          element={
            screensizelistener.W <= 1100 ? <UserMenu /> : <Navigate to={"/"} />
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
  );
}

export default Home;
