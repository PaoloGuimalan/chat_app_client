/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { ManualInitConversationListRequest } from "@/reusables/hooks/requests";
import { isUserOnline, timeSince } from "@/reusables/hooks/reusable";
import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BiGroup, BiSolidPhoneCall } from "react-icons/bi";
import { TbServer2 } from "react-icons/tb";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  SET_CONVERSATION_SETUP,
  SET_MINIMIZED_CONVERSATION,
  SET_TOGGLE_RIGHT_WIDGET,
} from "@/redux/types";
import {
  AuthenticationInterface,
  IPreviewParicipants,
} from "@/reusables/vars/interfaces";
import DefaultProfile from "../../../../assets/imgs/default.png";
import GroupChatIcon from "../../../../assets/imgs/group-chat-icon.jpg";
import ServerIcon from "../../../../assets/imgs/servericon.png";
import { conversationsetupstate } from "@/redux/actions/states";

function ArchivedMessages() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const istypinglist = useSelector((state: any) => state.istypinglist);
  const previewparticipants: IPreviewParicipants[] = useSelector(
    (state: any) => state.previewparticipants,
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const getChannelPreviewParticipants = (channelID: string) => {
    return previewparticipants.filter(
      (flt: IPreviewParicipants) => flt.channelID === channelID,
    );
  };

  const [archives, setarchives] = useState<{
    list: any[];
    next: boolean;
    total: number;
    isLoaded: boolean;
  }>({
    list: [],
    next: false,
    total: 0,
    isLoaded: false,
  });

  const [page, setpage] = useState<number>(1);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const settogglerightwidget = (toggle: any) => {
    navigate("/");
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload: {
        togglerightwidget: toggle,
      },
    });
  };

  const navigateToConversation = (
    type: any,
    conversationID: any,
    userdetails: any,
  ) => {
    if (screensizelistener.W <= 1100) {
      if (type == "single") {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: userdetails,
              groupdetails: conversationsetupstate.groupdetails,
              type: "single",
            },
          },
        });
        navigate("/messages");
      } else {
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
        navigate("/messages");
      }
    } else {
      if (type == "single") {
        dispatch({
          type: SET_MINIMIZED_CONVERSATION,
          payload: {
            conversation: {
              conversationid: conversationID,
              userdetails: userdetails,
              groupdetails: conversationsetupstate.groupdetails,
              type: "single",
            },
          },
        });
      } else {
        dispatch({
          type: SET_MINIMIZED_CONVERSATION,
          payload: {
            conversation: {
              conversationid: conversationID,
              userdetails: conversationsetupstate.userdetails,
              groupdetails: userdetails,
              type: "group",
            },
          },
        });
        settogglerightwidget("messages");
      }
    }
  };

  const messageTypeChecker: any = {
    video: "a video",
    audio: "an audio",
    image: "a photo",
    any: "a file",
  };

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let currentView = false;
    if (divcontentRef) {
      if (divcontentRef.current) {
        divcontentRef.current.onscroll = () => {
          // console.log("Hello")
          if (divlazyloaderRef && divlazyloaderRef.current) {
            const top = divlazyloaderRef.current.getBoundingClientRect().top;
            const isVisible = top + 0 >= 0 && top - 0 <= window.innerHeight;
            // const isVisible = top > 0 ? true : false;
            // console.log((top + 0) >= 0 && (top - 0) <= window.innerHeight);
            if (currentView != isVisible) {
              currentView = isVisible;
              if (currentView) {
                // setrange((prev) => prev + 20);
                setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }
  }, [divcontentRef, divlazyloaderRef, archives.isLoaded]);

  useEffect(() => {
    ManualInitConversationListRequest(page, 10)
      .then((response) => {
        setarchives({
          list: response.result.archives,
          next: response.result.next,
          total: response.result.total,
          isLoaded: true,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, [page]);

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Archives
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
        {!archives.isLoaded && (
          <div className="tw-w-full tw-flex-row tw-items-center">
            <span className="tw-text-[14px] tw-text-[#757b87]">Loading...</span>
          </div>
        )}
        {archives.isLoaded && (
          <div
            ref={divcontentRef}
            id=""
            className="scroller tw-w-full" //  tw-bg-[#f0f2f5] tw-pt-[20px] tw-rounded-md
          >
            {archives.list.map((msgslst: any, i: number) => {
              if (msgslst.conversationType == "single") {
                return msgslst.users.map((msgsurs: any, i: number) => {
                  if (msgsurs._id != authentication.user.userID) {
                    return (
                      <motion.div
                        whileHover={{
                          backgroundColor: "rgb(200, 200, 200)",
                        }}
                        onClick={() => {
                          navigateToConversation(
                            "single",
                            msgslst.conversationID,
                            msgsurs,
                          );
                        }}
                        key={i}
                        className="div_messages_list_cards tw-border-[0px]"
                      >
                        <div id="div_img_cncts_container">
                          <div id="div_img_search_profiles_container_cncts">
                            <CachedImage
                              src={
                                msgsurs.profile == "none"
                                  ? DefaultProfile
                                  : msgsurs.profile
                              }
                              className={
                                msgsurs.profile == "none"
                                  ? "img_search_profiles_ntfs"
                                  : ""
                              }
                              id={
                                msgsurs.profile == "none"
                                  ? ""
                                  : "img_actual_profile"
                              }
                            />
                          </div>
                          {isUserOnline(activeuserslist, msgsurs._id) && (
                            <div className="div_online_indicator" />
                          )}
                        </div>
                        <div id="div_messages_list_name">
                          <span className="span_messages_list_name">
                            {msgsurs.fullname.firstName}
                            {msgsurs.fullname.middleName == "N/A"
                              ? ""
                              : ` ${msgsurs.fullname.middleName}`}{" "}
                            {msgsurs.fullname.lastName}
                          </span>
                          {istypinglist.filter(
                            (flt: any) =>
                              flt.conversationID === msgslst.conversationID,
                          ).length > 0 ? (
                            <span className="span_messages_list_name">
                              is typing...
                            </span>
                          ) : msgslst.isDeleted ? (
                            <span className="span_messages_list_name">
                              {msgslst.sender == authentication.user.userID
                                ? "you: "
                                : ""}
                              [Deleted message]
                            </span>
                          ) : (
                            <span className="span_messages_list_name">
                              {msgslst.sender == authentication.user.userID
                                ? "you: "
                                : ""}
                              {msgslst.messageType === "text" ||
                              msgslst.messageType === "notif" ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: msgslst.isDeleted
                                      ? "[Deleted]"
                                      : msgslst.content,
                                  }}
                                />
                              ) : !msgslst.messageType.includes("image") &&
                                !msgslst.messageType.includes("video") &&
                                !msgslst.messageType.includes("audio") ? (
                                `Sent ${messageTypeChecker["any"]}`
                              ) : (
                                `Sent ${
                                  messageTypeChecker[
                                    msgslst.messageType.split("/")[0]
                                  ]
                                }`
                              )}
                            </span>
                          )}
                          {msgslst.messageDate.time ? (
                            <span className="span_messages_list_name">
                              {msgslst.messageDate.date} .{" "}
                              {msgslst.messageDate.time}
                            </span>
                          ) : (
                            <span className="span_messages_list_name">
                              {msgslst.messageDate.date
                                ? timeSince(msgslst.messageDate.date)
                                : timeSince(msgslst.messageDate)}
                            </span>
                          )}
                        </div>
                        {(msgslst.unread > 0 ||
                          getChannelPreviewParticipants(msgslst.conversationID)
                            .length > 0) && (
                          <div className="tw-flex tw-flex-col tw-justify-between">
                            {msgslst.unread > 0 && (
                              <span className="span_messages_list_counts">
                                {msgslst.unread}
                              </span>
                            )}
                            {getChannelPreviewParticipants(
                              msgslst.conversationID,
                            ).length > 0 && (
                              <div>
                                <BiSolidPhoneCall color="lime" />
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  }
                });
              } else if (msgslst.conversationType == "group") {
                return (
                  <motion.div
                    whileHover={{
                      backgroundColor: "rgb(200, 200, 200)",
                    }}
                    onClick={() => {
                      navigateToConversation("group", msgslst.conversationID, {
                        ...msgslst.groupdetails,
                        receivers: msgslst.receivers,
                      });
                    }}
                    key={i}
                    className="div_messages_list_cards tw-border-[0px]"
                  >
                    <div id="div_img_cncts_container">
                      <div id="div_img_search_profiles_container_cncts">
                        <CachedImage
                          src={
                            msgslst.groupdetails &&
                            msgslst.groupdetails?.profile &&
                            msgslst.groupdetails?.profile !== "N/A"
                              ? msgslst.groupdetails?.profile
                              : GroupChatIcon
                          }
                          id={
                            msgslst.groupdetails &&
                            msgslst.groupdetails?.profile &&
                            msgslst.groupdetails?.profile !== "N/A"
                              ? "img_actual_profile_main"
                              : ""
                          }
                          className={
                            msgslst.groupdetails &&
                            msgslst.groupdetails?.profile &&
                            msgslst.groupdetails?.profile !== "N/A"
                              ? ""
                              : "img_gc_profiles_ntfs"
                          }
                        />
                      </div>
                    </div>
                    <div id="div_messages_list_name">
                      <span className="span_messages_list_name tw-flex tw-items-end tw-gap-[3px] tw-text-[#1c7DEF]">
                        {msgslst.groupdetails.groupName}{" "}
                        <BiGroup
                          style={{ fontSize: "20px", color: "#1c7DEF" }}
                        />
                      </span>
                      {istypinglist.filter(
                        (flt: any) =>
                          flt.conversationID === msgslst.conversationID,
                      ).length > 0 ? (
                        <span className="span_messages_list_name">
                          someone is typing...
                        </span>
                      ) : msgslst.isDeleted ? (
                        <span className="span_messages_list_name">
                          {msgslst.sender == authentication.user.userID
                            ? "you: "
                            : ""}
                          [Deleted message]
                        </span>
                      ) : (
                        <span className="span_messages_list_name">
                          {msgslst.sender == authentication.user.userID
                            ? "you: "
                            : ""}
                          {msgslst.messageType === "text" ||
                          msgslst.messageType === "notif" ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: msgslst.isDeleted
                                  ? "[Deleted]"
                                  : msgslst.content,
                              }}
                            />
                          ) : !msgslst.messageType.includes("image") &&
                            !msgslst.messageType.includes("video") &&
                            !msgslst.messageType.includes("audio") ? (
                            `Sent ${messageTypeChecker["any"]}`
                          ) : (
                            `Sent ${
                              messageTypeChecker[
                                msgslst.messageType.split("/")[0]
                              ]
                            }`
                          )}
                        </span>
                      )}
                      {msgslst.messageDate.time ? (
                        <span className="span_messages_list_name">
                          {msgslst.messageDate.date} .{" "}
                          {msgslst.messageDate.time}
                        </span>
                      ) : (
                        <span className="span_messages_list_name">
                          {msgslst.messageDate.date
                            ? timeSince(msgslst.messageDate.date)
                            : timeSince(msgslst.messageDate)}
                        </span>
                      )}
                    </div>
                    {(msgslst.unread > 0 ||
                      getChannelPreviewParticipants(msgslst.conversationID)
                        .length > 0) && (
                      <div className="tw-flex tw-flex-col tw-justify-between">
                        {msgslst.unread > 0 && (
                          <span className="span_messages_list_counts">
                            {msgslst.unread}
                          </span>
                        )}
                        {getChannelPreviewParticipants(msgslst.conversationID)
                          .length > 0 && (
                          <div>
                            <BiSolidPhoneCall color="lime" />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              } else if (msgslst.conversationType === "server") {
                return (
                  <motion.div
                    whileHover={{
                      backgroundColor: "rgb(200, 200, 200)",
                    }}
                    onClick={() => {
                      navigate(
                        `/servers/${msgslst.serverdetails?.serverID}/${msgslst.groupdetails.groupID}`,
                      );
                    }}
                    key={i}
                    className="div_messages_list_cards tw-border-[0px]"
                  >
                    <div id="div_img_cncts_container">
                      <div id="div_img_search_profiles_container_cncts">
                        <CachedImage
                          src={
                            msgslst.serverdetails &&
                            msgslst.serverdetails?.profile &&
                            msgslst.serverdetails?.profile !== "N/A"
                              ? msgslst.serverdetails?.profile
                              : ServerIcon
                          }
                          id={
                            msgslst.serverdetails &&
                            msgslst.serverdetails?.profile &&
                            msgslst.serverdetails?.profile !== "N/A"
                              ? "img_actual_profile_main"
                              : ""
                          }
                          className={
                            msgslst.serverdetails &&
                            msgslst.serverdetails?.profile &&
                            msgslst.serverdetails?.profile !== "N/A"
                              ? ""
                              : "img_server_profiles_ntfs"
                          }
                        />
                      </div>
                    </div>
                    <div id="div_messages_list_name">
                      <span className="span_messages_list_name_server tw-flex tw-items-start tw-gap-[3px] tw-text-[#e69500]">
                        <div className="tw-flex tw-flex-col">
                          <span className="tw-text-[14px]">
                            {msgslst.serverdetails?.serverName}
                          </span>
                          <span className="tw-text-[12px]">
                            {msgslst.groupdetails.groupName}
                          </span>
                        </div>
                        <TbServer2
                          style={{ fontSize: "20px", color: "#e69500" }}
                        />
                      </span>
                      {istypinglist.filter(
                        (flt: any) =>
                          flt.conversationID === msgslst.conversationID,
                      ).length > 0 ? (
                        <span className="span_messages_list_name">
                          someone is typing...
                        </span>
                      ) : msgslst.isDeleted ? (
                        <span className="span_messages_list_name">
                          {msgslst.sender == authentication.user.userID
                            ? "you: "
                            : ""}
                          [Deleted message]
                        </span>
                      ) : (
                        <span className="span_messages_list_name">
                          {msgslst.sender == authentication.user.userID
                            ? "you: "
                            : ""}
                          {msgslst.messageType === "text" ||
                          msgslst.messageType === "notif" ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: msgslst.isDeleted
                                  ? "[Deleted]"
                                  : msgslst.content,
                              }}
                            />
                          ) : !msgslst.messageType.includes("image") &&
                            !msgslst.messageType.includes("video") &&
                            !msgslst.messageType.includes("audio") ? (
                            `Sent ${messageTypeChecker["any"]}`
                          ) : (
                            `Sent ${
                              messageTypeChecker[
                                msgslst.messageType.split("/")[0]
                              ]
                            }`
                          )}
                        </span>
                      )}
                      {msgslst.messageDate.time ? (
                        <span className="span_messages_list_name">
                          {msgslst.messageDate.date} .{" "}
                          {msgslst.messageDate.time}
                        </span>
                      ) : (
                        <span className="span_messages_list_name">
                          {msgslst.messageDate.date
                            ? timeSince(msgslst.messageDate.date)
                            : timeSince(msgslst.messageDate)}
                        </span>
                      )}
                    </div>
                    {msgslst.unread > 0 && (
                      <div>
                        <span className="span_messages_list_counts">
                          {msgslst.unread}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              }
            })}
            {archives.next && (
              <div ref={divlazyloaderRef} id="div_isLoading_notifications">
                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                  id="div_loader_request"
                >
                  <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* <div></div> */}
    </div>
  );
}

export default ArchivedMessages;
