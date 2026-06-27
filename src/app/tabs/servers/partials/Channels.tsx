/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import NoChannel from "./NoChannel";
import ServerConversation from "./ServerConversation";
import { InitServerChannelsRequest } from "@/reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import {
  ChannelsListInterface,
  IPreviewParicipants,
  ServerChannelsListInterface,
} from "@/reusables/vars/interfaces";
import { FaHashtag, FaLocationArrow, FaLock } from "react-icons/fa6";
import { motion } from "framer-motion";
import {
  SET_CONVERSATION_SETUP,
  SET_PREVIEW_PARTICIPANTS_BULK,
} from "@/redux/types";
import { conversationsetupstate } from "@/redux/actions/states";
// import { FcInfo } from "react-icons/fc";
import ServerInfoModal from "@/app/widgets/modals/Servers/ServerInfoModal";
import { IoMdAdd } from "react-icons/io";
import CreateChannelModal from "@/app/widgets/modals/Servers/CreateChannelModal";
import { BiSolidInfoCircle } from "react-icons/bi";
import { AiFillSound, AiOutlineSound } from "react-icons/ai";
import { MdSettingsVoice } from "react-icons/md";
import ServerAvatar from "@/reusables/design/ServerAvatar";

function Channels() {
  // serverlist
  const messageslist = useSelector((state: any) => state.messageslist);
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const previewparticipants: IPreviewParicipants[] = useSelector(
    (state: any) => state.previewparticipants,
  );

  const dispatch = useDispatch();
  const params = useParams();
  const urllocation = useLocation();
  const navigate = useNavigate();

  const serverID = useMemo(() => params.serverID, [params]);
  const isMobile = screensizelistener.W <= 900;
  const isConversationOpen = useMemo(
    () => urllocation.pathname.split("/").filter(Boolean).length >= 3,
    [urllocation.pathname],
  );
  const showSidebar = !isMobile || !isConversationOpen;
  const showConversationPane = !isMobile || isConversationOpen;
  // const serverDetails = useMemo(
  //   () =>
  //     serverlist
  //       ? serverlist.length > 0
  //         ? serverlist.filter((flt: any) => flt.serverID === serverID)[0]
  //         : null
  //       : null,
  //   [serverlist, serverID],
  // );

  const [serverdetails, setserverdetails] =
    useState<ServerChannelsListInterface | null>(null);
  const [toggleserverinfomodal, settoggleserverinfomodal] =
    useState<boolean>(false);
  const [toggleserveraddchannelmodal, settoggleserveraddchannelmodal] =
    useState<boolean>(false);
  const [isLoaded, setisLoaded] = useState<boolean>(false);
  const [haveAccess, sethaveAccess] = useState<boolean>(false);

  const InitServerChannelsProcess = () => {
    InitServerChannelsRequest({
      serverID: serverID,
    })
      .then((response: any) => {
        dispatch({
          type: SET_PREVIEW_PARTICIPANTS_BULK,
          payload: {
            participants: response.data[0].channels
              .map((mp: any) => mp.voice_participants)
              .flat(),
          },
        });
        setserverdetails(response.data[0]);
        setTimeout(() => {
          setisLoaded(true);
          sethaveAccess(true);
        }, 1000);
      })
      .catch((err) => {
        sethaveAccess(false);
        navigate("/servers");
        console.log(err);
      });
  };

  const getChannelPreviewParticipants = (channelID: string) => {
    return previewparticipants.filter(
      (flt: IPreviewParicipants) => flt.channelID === channelID,
    );
  };

  useEffect(() => {
    setisLoaded(false);
    sethaveAccess(false);
    setserverdetails(null);
  }, [serverID]);

  useEffect(() => {
    InitServerChannelsProcess();
  }, [serverID, messageslist]);

  useEffect(() => {
    if (!serverdetails?._id) return;

    const eventName = serverdetails?._id;
    const handler = (event: CustomEvent) => {
      const data = event.detail.data;
      switch (event.detail.event) {
        case "removed_user_notif":
          if (data.result.type === "server") {
            navigate("/servers");

            return;
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener(eventName, handler as EventListener);

    return () => {
      document.removeEventListener(eventName, handler as EventListener);
    };
  }, [serverdetails]);

  return (
    <motion.div
      initial={{
        flexDirection: isMobile ? "column" : "row",
        paddingLeft:
          screensizelistener.W <= 900
            ? urllocation.pathname.split("/").length < 4
              ? "0px"
              : "7px"
            : "0px",
      }}
      animate={{
        flexDirection: isMobile ? "column" : "row",
        paddingLeft:
          screensizelistener.W <= 900
            ? urllocation.pathname.split("/").length < 4
              ? "0px"
              : "7px"
            : "0px",
      }}
      data-mobile-pane={
        isMobile
          ? isConversationOpen
            ? "conversation"
            : "sidebar"
          : "desktop"
      }
      className="cl-server-channels-shell tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-stretch tw-justify-start tw-h-full tw-min-h-0 tw-p-0 tw-m-0"
    >
      {showSidebar && (
        <motion.div
          initial={{
            display: "flex",
            width: isMobile ? "100%" : "250px",
            maxWidth: isMobile ? "100%" : "250px",
            borderBottomRightRadius: isMobile ? "10px" : "0px",
            borderTopRightRadius: isMobile ? "10px" : "0px",
            opacity: 1,
          }}
          animate={{
            display: "flex",
            width: isMobile ? "100%" : "250px",
            maxWidth: isMobile ? "100%" : "250px",
            borderBottomRightRadius: isMobile ? "10px" : "0px",
            borderTopRightRadius: isMobile ? "10px" : "0px",
            opacity: 1,
            flex: isMobile ? "1 1 100%" : "0 0 250px",
          }}
          className="cl-server-channels-sidebar tw-bg-[var(--surface)] tw-flex tw-w-full tw-flex-1 tw-flex-col tw-h-full tw-items-center tw-overflow-x-hidden tw-border-r tw-border-[var(--border)]"
        >
        <div
          id="div_server_channel_header"
          className="cl-server-channels-sidebar__header"
        >
          <div id="div_conversation_user" className="tw-items-center">
            {isLoaded ? (
              <div id="div_img_cncts_container">
                <div id="div_img_search_profiles_container_cncts">
                  <ServerAvatar
                    name={serverdetails?.serverName}
                    src={
                      serverdetails &&
                      serverdetails.profile &&
                      serverdetails.profile !== "N/A"
                        ? serverdetails.profile
                        : null
                    }
                    size={40}
                    shape="circle"
                  />
                </div>
              </div>
            ) : (
              <motion.button
                initial={{
                  backgroundColor: "var(--surface-3)",
                }}
                animate={{
                  backgroundColor: "var(--surface-hover)",
                }}
                transition={{
                  duration: 0.7,
                  delay: 0,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="btn_server_navigations cl-server-channel-header__avatar-skeleton"
              >
                <div id="div_img_search_profiles_container_cncts" />
              </motion.button>
            )}
            {isLoaded ? (
              <div
                id="div_conversation_user_name"
                className="cl-server-channel-header__name"
              >
                <span className="span_server_name_label cl-server-channel-header__label">
                  {serverdetails?.serverName}
                </span>
              </div>
            ) : (
              <motion.div
                initial={{
                  backgroundColor: "var(--surface-3)",
                }}
                animate={{
                  backgroundColor: "var(--surface-hover)",
                }}
                transition={{
                  duration: 0.7,
                  delay: 0,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="cl-server-channel-header__name-skeleton tw-select-none tw-h-[12px] tw-text-[13px] tw-flex tw-flex-row tw-items-center tw-gap-[4px] tw-p-[5px] tw-pt-[6px] tw-pb-[6px] tw-w-[100%] tw-rounded-[4px]"
              />
            )}
            <div id="div_conversation_header_navigations">
              {toggleserverinfomodal && serverdetails && (
                <ServerInfoModal
                  serverdetails={serverdetails}
                  onclose={settoggleserverinfomodal}
                />
              )}
              <motion.button
                whileHover={{
                  backgroundColor: "var(--surface-hover)",
                }}
                className="btn_conversation_header_navigation cl-conversation-header-action--server"
                disabled={serverdetails ? false : true}
                onClick={() => {
                  settoggleserverinfomodal(!toggleserverinfomodal);
                }}
              >
                <BiSolidInfoCircle
                  style={{ fontSize: "25px", color: "var(--gold)" }}
                />
              </motion.button>
            </div>
          </div>
        </div>
        <div className="cl-server-channels-sidebar__body tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-items-start tw-min-h-0 tw-flex-1">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px] tw-pt-[10px]">
            <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-w-full tw-items-center tw-justify-between tw-px-[8px]">
              <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1 tw-text-[var(--text)] tw-pl-[2px]">
                {serverdetails?.channels &&
                  serverdetails?.channels.length > 0 &&
                  "Channels"}
              </span>
              {toggleserveraddchannelmodal && (
                <CreateChannelModal
                  serverID={serverdetails?.serverID}
                  setisCreateChannelToggle={settoggleserveraddchannelmodal}
                  servermemberslist={serverdetails?.usersWithInfo}
                  refreshChannelsList={InitServerChannelsProcess}
                />
              )}
              {serverdetails?.channels &&
                serverdetails?.channels.length > 0 && (
                  <button
                    onClick={() => {
                      settoggleserveraddchannelmodal(
                        !toggleserveraddchannelmodal,
                      );
                    }}
                    className="tw-w-[30px] tw-h-[30px] tw-p-0 tw-flex tw-items-center tw-justify-center tw-border-none tw-rounded-[10px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer"
                  >
                    <IoMdAdd style={{ fontSize: "17px" }} />
                  </button>
                )}
            </div>
            <div className="cl-server-channels-sidebar__list tw-bg-transparent tw-gap-[6px] tw-w-full tw-flex tw-flex-1 tw-flex-col tw-items-start tw-px-[8px]">
              {isLoaded
                ? haveAccess &&
                  serverdetails?.channels.map((mp: ChannelsListInterface) => {
                    const isActive = urllocation.pathname.includes(mp.groupID);
                    return (
                      <motion.div
                        key={mp.groupID}
                        initial={{
                          backgroundColor: isActive
                            ? "color-mix(in srgb, var(--gold) 14%, var(--surface) 86%)"
                            : "transparent",
                          color: isActive ? "var(--gold)" : "var(--text)",
                        }}
                        animate={{
                          backgroundColor: isActive
                            ? "color-mix(in srgb, var(--gold) 14%, var(--surface) 86%)"
                            : "transparent",
                          color: isActive ? "var(--gold)" : "var(--text)",
                        }}
                        whileHover={{
                          backgroundColor: "var(--surface-hover)",
                          color: "var(--text)",
                        }}
                        onClick={() => {
                          if (!urllocation.pathname.includes(mp.groupID)) {
                            dispatch({
                              type: SET_CONVERSATION_SETUP,
                              payload: {
                                conversationsetup: conversationsetupstate,
                              },
                            });
                            navigate(`/servers/${serverID}/${mp.groupID}`);
                          }
                        }}
                        data-active={isActive}
                        className="cl-server-channel-row tw-select-none tw-cursor-pointer tw-text-[13px] tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-p-[10px] tw-w-full tw-rounded-[12px]"
                      >
                        <div className="cl-server-channel-row__icon-shell">
                          {mp.type === "voice" ? (
                            mp.privacy ? (
                              <AiFillSound />
                            ) : (
                              <AiOutlineSound />
                            )
                          ) : mp.privacy ? (
                            <FaLock style={{ fontSize: "13px" }} />
                          ) : (
                            <FaHashtag />
                          )}
                        </div>
                        <div className="tw-flex tw-flex-1 tw-flex-col tw-min-w-0 tw-items-start">
                          <span
                            className={`tw-bg-transparent tw-flex tw-flex-1 tw-w-full tw-min-w-0 tw-truncate ${
                              urllocation.pathname.includes(mp.groupID)
                                ? "tw-font-semibold"
                                : "tw-font-normal"
                            } ${mp.messages.length > 0 && "tw-font-semibold"} `}
                          >
                            {mp.groupName}
                          </span>
                          <span className="tw-text-[11px] tw-text-[var(--text-2)] tw-font-Inter">
                            {mp.type === "voice"
                              ? "Voice channel"
                              : "Text channel"}
                          </span>
                        </div>
                        <div className="tw-flex tw-items-center tw-gap-[8px]">
                          {mp.type === "voice" &&
                            getChannelPreviewParticipants(mp.groupID).length >
                              0 && <MdSettingsVoice />}
                          {urllocation.pathname.includes(mp.groupID) && (
                            <FaLocationArrow />
                          )}
                          {mp.messages.length > 0 && (
                            <span className="span_channel_messages_list_counts">
                              {mp.messages[0].unread}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                : Array.from({ length: 5 }).map((_: any, i: number) => {
                    return (
                      <motion.div
                        key={i}
                        initial={{
                          backgroundColor: "var(--surface-3)",
                        }}
                        animate={{
                          backgroundColor: "var(--surface-hover)",
                        }}
                        transition={{
                          duration: 0.7,
                          delay: i - 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="tw-select-none tw-h-[14px] tw-text-[13px] tw-flex tw-flex-row tw-items-center tw-gap-[4px] tw-p-[8px] tw-w-[calc(100%-8px)] tw-rounded-[10px]"
                      />
                    );
                  })}
            </div>
          </div>
        </div>
        </motion.div>
      )}
      {showConversationPane && (
        <motion.div
          initial={{
            width: isMobile ? "100%" : "auto",
            maxWidth: isMobile ? "100%" : "none",
            flex: isMobile ? "1 1 100%" : "1 1 auto",
          }}
          animate={{
            width: isMobile ? "100%" : "auto",
            maxWidth: isMobile ? "100%" : "none",
            flex: isMobile ? "1 1 100%" : "1 1 auto",
          }}
          className="cl-server-conversation-shell tw-flex tw-w-full tw-flex-1 tw-h-full tw-overflow-x-hidden tw-border-l tw-border-[var(--border)]"
        >
          <Routes>
            <Route
              path="/"
              element={
                !isMobile && isLoaded && haveAccess ? (
                  <NoChannel server={serverdetails} />
                ) : (
                  !isMobile && (
                    <div className="tw-bg-[var(--surface)] tw-flex tw-flex-col tw-flex-1 tw-items-center tw-justify-center tw-h-full tw-rounded-tr-[10px] tw-rounded-br-[10px] tw-border-l tw-border-[var(--border)]" />
                  )
                )
              }
            />
            <Route
              path="/:conversationID"
              element={
                isLoaded && haveAccess ? (
                  <ServerConversation />
                ) : (
                  <div className="tw-bg-[var(--surface)] tw-flex tw-flex-col tw-flex-1 tw-items-center tw-justify-center tw-h-full tw-rounded-tr-[10px] tw-rounded-br-[10px] tw-border-l tw-border-[var(--border)]" />
                )
              }
            />
          </Routes>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Channels;
