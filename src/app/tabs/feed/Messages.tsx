/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import "../../../styles/styles.css";
import {
  AiOutlineLoading3Quarters,
  AiOutlineMessage,
  AiOutlineSearch,
} from "react-icons/ai";
import { BiEditAlt, BiSolidPhoneCall } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import Conversation from "../messenger/Conversation";
import { InitConversationListRequest } from "../../../reusables/hooks/requests";
import { motion } from "framer-motion";
import DefaultProfile from "../../../assets/imgs/default.png";
import GroupChatIcon from "../../../assets/imgs/group-chat-icon.jpg";
import ServerIcon from "../../../assets/imgs/servericon.png";
import {
  SET_CONVERSATION_SETUP,
  SET_MESSAGES_LIST,
  SET_MESSAGES_LIST_OVERRIDE,
  SET_PREVIEW_PARTICIPANTS_BULK,
} from "../../../redux/types";
import CreateGroupChatModal from "../../widgets/modals/CreateGroupChatModal";
import { conversationsetupstate } from "../../../redux/actions/states";
import { isUserOnline, timeSince } from "../../../reusables/hooks/reusable";
import { useNavigate } from "react-router-dom";
import MessageItemLoader from "@/app/reusables/loaders/MessageItemLoader";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  AuthenticationInterface,
  IPreviewParicipants,
  IUserSettings,
} from "@/reusables/vars/interfaces";
import {
  getSettings,
  persistSettings,
} from "@/reusables/hooks/localforagehelper";

const PAGE_SIZE = 20;

function Messages() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const conversationsetup = useSelector(
    (state: any) => state.conversationsetup,
  );
  const messageslist = useSelector((state: any) => state.messageslist);
  const istypinglist = useSelector((state: any) => state.istypinglist);
  const previewparticipants: IPreviewParicipants[] = useSelector(
    (state: any) => state.previewparticipants,
  );
  const usersettings: IUserSettings = useSelector(
    (state: any) => state.usersettings,
  );

  const [isLoading, setisLoading] = useState<boolean>(true);
  const [isCreateGCToggle, setisCreateGCToggle] = useState<boolean>(false);
  const [conversationTypeSet, setconversationTypeSet] =
    useState<string>("common");
  const [page, setpage] = useState<number>(1);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [isNext, setisNext] = useState<boolean>(true);

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

  const isCompact = screensizelistener.W <= 1100;

  const getChannelPreviewParticipants = (channelID: string) => {
    return previewparticipants.filter(
      (flt: IPreviewParicipants) => flt.channelID === channelID,
    );
  };

  const messageTypeChecker: Record<string, string> = {
    video: "a video",
    audio: "an audio",
    image: "a photo",
    any: "a file",
  };

  const conversationTypeOptions = [
    ["common", "All"],
    ["direct", "Direct"],
    ["groups", "Groups"],
  ] as const;

  useEffect(() => {
    if (authentication.user.userID) {
      getSettings(authentication.user.userID)
        .then((value) => {
          const savedType = value?.messages?.type;
          if (savedType && ["common", "direct", "groups"].includes(savedType)) {
            setconversationTypeSet(savedType);
          } else {
            setconversationTypeSet("common");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [authentication.user.userID]);

  useEffect(() => {
    InitConversationListRequest(page, PAGE_SIZE).then((response) => {
      setisNext(Boolean(response.next));
      dispatch({
        type: SET_PREVIEW_PARTICIPANTS_BULK,
        payload: {
          participants: response.conversationslist
            .map((mp: any) => mp.voice_participants)
            .flat(),
        },
      });

      dispatch({
        type: page === 1 ? SET_MESSAGES_LIST_OVERRIDE : SET_MESSAGES_LIST,
        payload: {
          messageslist:
            page === 1
              ? response.conversationslist
              : response.conversationslist,
        },
      });

      setisLoading(false);
    });
  }, [page, reloadSeed]);

  useEffect(() => {
    let currentView = false;
    if (divcontentRef.current) {
      divcontentRef.current.onscroll = () => {
        if (divlazyloaderRef.current) {
          const top = divlazyloaderRef.current.getBoundingClientRect().top;
          const isVisible = top + 0 >= 0 && top - 0 <= window.innerHeight;
          if (currentView !== isVisible) {
            currentView = isVisible;
            if (currentView) {
              setpage((prev) => prev + 1);
            }
          }
        }
      };
    }
  }, [divcontentRef, divlazyloaderRef, isLoading, conversationsetup]);

  const setConversationListGroups = (type: string) => {
    if (!authentication.user.userID) {
      return;
    }

    if (!["common", "direct", "groups"].includes(type)) {
      return;
    }

    persistSettings(authentication.user.userID, {
      ...usersettings,
      messages: {
        ...usersettings.messages,
        type,
      },
    })
      .then(() => {
        setconversationTypeSet(type);
        setisLoading(true);
        dispatch({
          type: SET_MESSAGES_LIST_OVERRIDE,
          payload: {
            messageslist: [],
          },
        });
        setpage(1);
        setReloadSeed((seed) => seed + 1);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const navigateToConversation = (
    type: "single" | "group",
    conversationID: string,
    userdetails: any,
  ) => {
    if (type === "single") {
      dispatch({
        type: SET_CONVERSATION_SETUP,
        payload: {
          conversationsetup: {
            conversationid: conversationID,
            userdetails,
            groupdetails: conversationsetupstate.groupdetails,
            type: "single",
          },
        },
      });
      return;
    }

    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: {
        conversationsetup: {
          conversationid: conversationID,
          userdetails: conversationsetupstate.userdetails,
          groupdetails: userdetails,
          type: "group",
        },
      },
    });
  };

  const normalizedMessages = useMemo(() => {
    return messageslist
      .map((msgslst: any) => {
        if (msgslst.conversationType === "single") {
          const peer = msgslst.users?.find(
            (user: any) => user._id !== authentication.user.userID,
          );

          if (!peer) {
            return null;
          }

          return {
            key: msgslst.conversationID,
            kind: "single" as const,
            title: `${peer.fullname.firstName}${
              peer.fullname.middleName === "N/A"
                ? ""
                : ` ${peer.fullname.middleName}`
            } ${peer.fullname.lastName}`,
            subtitle: msgslst.isDeleted
              ? `${msgslst.sender == authentication.user.userID ? "you: " : ""}[Deleted message]`
              : `${msgslst.sender == authentication.user.userID ? "you: " : ""}${
                  msgslst.messageType === "text" || msgslst.messageType === "notif"
                    ? msgslst.content
                    : !msgslst.messageType.includes("image") &&
                        !msgslst.messageType.includes("video") &&
                        !msgslst.messageType.includes("audio")
                      ? `Sent ${messageTypeChecker.any}`
                      : `Sent ${
                          messageTypeChecker[msgslst.messageType.split("/")[0]]
                        }`
                }`,
            time: msgslst.messageDate.time
              ? `${msgslst.messageDate.date} · ${msgslst.messageDate.time}`
              : msgslst.messageDate.date
                ? timeSince(msgslst.messageDate.date)
                : timeSince(msgslst.messageDate),
            unread: msgslst.unread ?? 0,
            peer,
            avatar: peer.profile === "none" ? DefaultProfile : peer.profile,
            online: isUserOnline(activeuserslist, peer._id),
            typing:
              istypinglist.filter(
                (flt: any) => flt.conversationID === msgslst.conversationID,
              ).length > 0,
            message: msgslst,
          };
        }

        if (msgslst.conversationType === "group") {
          return {
            key: msgslst.conversationID,
            kind: "group" as const,
            title: msgslst.groupdetails.groupName,
            subtitle: msgslst.isDeleted
              ? `${msgslst.sender == authentication.user.userID ? "you: " : ""}[Deleted message]`
              : `${msgslst.sender == authentication.user.userID ? "you: " : ""}${
                  msgslst.messageType === "text" || msgslst.messageType === "notif"
                    ? msgslst.content
                    : !msgslst.messageType.includes("image") &&
                        !msgslst.messageType.includes("video") &&
                        !msgslst.messageType.includes("audio")
                      ? `Sent ${messageTypeChecker.any}`
                      : `Sent ${
                          messageTypeChecker[msgslst.messageType.split("/")[0]]
                        }`
                }`,
            time: msgslst.messageDate.time
              ? `${msgslst.messageDate.date} · ${msgslst.messageDate.time}`
              : msgslst.messageDate.date
                ? timeSince(msgslst.messageDate.date)
                : timeSince(msgslst.messageDate),
            unread: msgslst.unread ?? 0,
            avatar:
              msgslst.groupdetails?.profile &&
              msgslst.groupdetails?.profile !== "N/A"
                ? msgslst.groupdetails.profile
                : GroupChatIcon,
            typing:
              istypinglist.filter(
                (flt: any) => flt.conversationID === msgslst.conversationID,
              ).length > 0,
            message: msgslst,
          };
        }

        if (msgslst.conversationType === "server") {
          return {
            key: msgslst.conversationID,
            kind: "server" as const,
            title: msgslst.serverdetails?.serverName ?? "Server",
            subtitle: msgslst.groupdetails?.groupName ?? "Channel",
            time: msgslst.messageDate.time
              ? `${msgslst.messageDate.date} · ${msgslst.messageDate.time}`
              : msgslst.messageDate.date
                ? timeSince(msgslst.messageDate.date)
                : timeSince(msgslst.messageDate),
            unread: msgslst.unread ?? 0,
            avatar:
              msgslst.serverdetails?.profile &&
              msgslst.serverdetails?.profile !== "N/A"
                ? msgslst.serverdetails.profile
                : ServerIcon,
            typing:
              istypinglist.filter(
                (flt: any) => flt.conversationID === msgslst.conversationID,
              ).length > 0,
            message: msgslst,
          };
        }

        return null;
      })
      .filter(Boolean) as Array<{
      key: string;
      kind: "single" | "group" | "server";
      title: string;
      subtitle: string;
      time: string;
      unread: number;
      avatar: string;
      online?: boolean;
      typing: boolean;
      peer?: any;
      message: any;
    }>;
  }, [messageslist, activeuserslist, istypinglist, authentication.user.userID]);

  return (
    <div className="cl-screen-shell">
      {isCreateGCToggle && (
        <CreateGroupChatModal setisCreateGCToggle={setisCreateGCToggle} />
      )}

      <div className="cl-messages-shell">
        {(!isCompact || !conversationsetup.conversationid) && (
          <section className="cl-card cl-card-pad cl-messages-list-pane">
            <div className="cl-messages-header">
              <div className="cl-section-title" style={{ marginBottom: 0 }}>
                <div>
                  <h3>Messages</h3>
                </div>
                <div className="cl-messages-header-actions-wrap">
                  <motion.button
                    type="button"
                    className="cl-messages-header-action"
                    whileHover={{ y: -1 }}
                    onClick={() => {
                      setisCreateGCToggle(true);
                    }}
                    aria-label="New conversation"
                    title="New conversation"
                  >
                    <BiEditAlt size={18} />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="cl-input-shell cl-messages-search">
              <AiOutlineSearch size={18} color="var(--cl-text-3)" />
              <input placeholder="Search messages" />
            </div>

            <div className="cl-messages-filter-row">
              {conversationTypeOptions.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="cl-pill"
                  data-active={conversationTypeSet === value}
                  onClick={() => setConversationListGroups(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              ref={divcontentRef}
              className="cl-messages-list-scroll scroller"
            >
              {isLoading ? (
                Array.from({ length: 14 }, (_, i: number) => (
                  <MessageItemLoader key={i} />
                ))
              ) : normalizedMessages.length === 0 ? (
                <div className="cl-messages-empty-state">
                  <AiOutlineMessage size={20} />
                  <div>
                    <div className="cl-messages-empty-title">No messages</div>
                    <div className="cl-messages-empty-copy">
                      Start a conversation from contacts or create a group chat.
                    </div>
                  </div>
                </div>
              ) : (
                normalizedMessages.map((entry) => {
                  const isActiveConversation =
                    conversationsetup.conversationid === entry.key;

                  if (entry.kind === "server") {
                    return (
                      <motion.button
                        key={entry.key}
                        type="button"
                        whileHover={{ y: -1 }}
                        className="cl-message-item"
                        data-active={isActiveConversation}
                        onClick={() => {
                          const msg = entry.message;
                          navigate(
                            `/servers/${msg.serverdetails?.serverID}/${msg.groupdetails.groupID}`,
                          );
                        }}
                      >
                        <div className="cl-message-avatar-wrap">
                          <CachedImage
                            src={entry.avatar}
                            id="img_actual_profile_main"
                          />
                        </div>
                        <div className="cl-message-copy">
                          <div className="cl-message-copy-top">
                            <span className="cl-message-title cl-message-title-warm">
                              {entry.title}
                            </span>
                            <span className="cl-message-time">{entry.time}</span>
                          </div>
                          <div className="cl-message-copy-bottom">
                            <span className="cl-message-subtitle">
                              {entry.subtitle}
                            </span>
                            {entry.unread > 0 && (
                              <div className="cl-message-meta">
                                <span className="cl-message-badge">
                                  {entry.unread}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  }

                  return (
                    <motion.button
                      key={entry.key}
                      type="button"
                      whileHover={{ y: -1 }}
                      className="cl-message-item"
                      data-active={isActiveConversation}
                      onClick={() => {
                        const msg = entry.message;
                        if (entry.kind === "single") {
                          navigateToConversation(
                            "single",
                            msg.conversationID,
                            msg.users.find((user: any) => user._id !== authentication.user.userID),
                          );
                        } else {
                          navigateToConversation("group", msg.conversationID, {
                            ...msg.groupdetails,
                            receivers: msg.receivers,
                          });
                        }
                      }}
                    >
                      <div className="cl-message-avatar-wrap">
                        <CachedImage
                          src={entry.avatar}
                          id="img_actual_profile"
                          className={
                            entry.kind === "group"
                              ? "img_gc_profiles_ntfs"
                              : ""
                          }
                        />
                        {entry.online && (
                          <span className="cl-message-online-dot" />
                        )}
                      </div>
                      <div className="cl-message-copy">
                        <div className="cl-message-copy-top">
                          <span
                            className={
                              entry.kind === "group"
                                ? "cl-message-title cl-message-title-accent"
                                : "cl-message-title"
                            }
                          >
                            {entry.title}
                          </span>
                          <span className="cl-message-time">{entry.time}</span>
                        </div>
                        <div className="cl-message-copy-bottom">
                          <span className="cl-message-subtitle">
                            {entry.typing ? "typing…" : entry.subtitle}
                          </span>
                          {(entry.unread > 0 ||
                            getChannelPreviewParticipants(entry.key).length >
                              0) && (
                            <div className="cl-message-meta">
                              {entry.unread > 0 && (
                                <span className="cl-message-badge">
                                  {entry.unread}
                                </span>
                              )}
                              {getChannelPreviewParticipants(entry.key).length >
                                0 && <BiSolidPhoneCall color="lime" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}

              {isNext && (
                <div ref={divlazyloaderRef} className="cl-messages-sentinel">
                  <motion.div
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  >
                    <AiOutlineLoading3Quarters style={{ fontSize: "22px" }} />
                  </motion.div>
                </div>
              )}
            </div>
          </section>
        )}

        {conversationsetup.conversationid ? (
          <aside className="cl-card cl-messages-thread-card">
            <Conversation
              conversationsetup={conversationsetup}
              theme={{ primary: "#1c7def", lighten: "#82b7f6" }}
            />
          </aside>
        ) : !isCompact ? (
          <aside className="cl-card cl-card-pad cl-messages-thread-empty">
            <div className="cl-messages-empty-hero">
              <AiOutlineMessage size={28} />
              <div>
                <div className="cl-messages-empty-title">
                  No conversation selected
                </div>
                <div className="cl-messages-empty-copy">
                  Choose a chat from the list to open it here.
                </div>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export default Messages;
