/* eslint-disable @typescript-eslint/no-explicit-any */
import VoiceWindow from "@/app/absolutes/calls_v2/VoiceWindow";
import {
  AuthenticationInterface,
  IPreviewParicipants,
  IUserInterface,
} from "@/reusables/vars/interfaces";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AiFillSound, AiOutlineSound } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";
import { IoMdSettings } from "react-icons/io";
import { BiSolidInfoCircle, BiLogOut } from "react-icons/bi";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { RemoveRealmMemberRequest } from "@/reusables/hooks/requests";

function VoiceChannel({ conversationsetup, users, isMinimized }: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const previewparticipants: IPreviewParicipants[] = useSelector(
    (state: any) => state.previewparticipants,
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);

  const conversationType = useMemo(
    () => conversationsetup.type,
    [conversationsetup],
  );
  const isServerConversation = conversationType === "voice";

  const navigate = useNavigate();

  const urllocation = useLocation();

  const [toggleMenu, settoggleMenu] = useState<boolean>(false);
  const [isLeaving, setisLeaving] = useState<boolean>(false);

  const backPath = useMemo(
    () =>
      urllocation.pathname
        .split("/")
        .slice(0, urllocation.pathname.split("/").length - 1)
        .join("/"),
    [urllocation.pathname],
  );

  const LeaveVoiceChannelProcess = () => {
    setisLeaving(true);
    settoggleMenu(false);
    RemoveRealmMemberRequest(conversationsetup.groupdetails.groupID, [
      authentication.active_entity_context.id,
    ])
      .then((response) => {
        setisLeaving(false);
        if (response.status) {
          navigate(backPath);
        }
      })
      .catch((err) => {
        setisLeaving(false);
        console.log(err);
      });
  };

  const recepients = useMemo(
    () => users.map((mp: IUserInterface) => mp.userID),
    [users],
  );

  const conversationID =
    conversationsetup.conversationid || conversationsetup.conversationID;
  const isServerMobile = isServerConversation && screensizelistener.W <= 900;

  const currentParticipants = previewparticipants
    .filter((flt: IPreviewParicipants) => flt.channelID === conversationID)
    .map((mp: IPreviewParicipants) => mp.instance);
  const instance =
    currentParticipants.length > 0 ? currentParticipants[0] : null;

  return (
    <motion.div
      animate={{
        display:
          pathnamelistener.includes("messages") || isServerConversation
            ? "flex"
            : screensizelistener.W <= 900
              ? "none"
              : "flex",
        maxWidth:
          pathnamelistener.includes("messages") || isServerConversation
            ? "100%"
            : screensizelistener.W <= 900
              ? "350px"
              : "350px",
        paddingTop:
          pathnamelistener.includes("messages") || isServerConversation
            ? isServerConversation
              ? "0px"
              : "10px"
            : screensizelistener.W <= 900
              ? "20px"
              : "20px",
      }}
      id="div_conversation"
    >
      <motion.div
        initial={{
          paddingRight: isServerMobile
            ? "0px"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "0px"
              : screensizelistener.W <= 900
                ? "20px"
                : "20px",
          paddingBottom: isServerMobile
            ? "0px"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          paddingTop: isServerMobile
            ? "0px"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          width: isServerMobile
            ? "100%"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 20px)"
                : "calc(100% - 20px)",
          height: isServerMobile
            ? "100%"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 10px)"
                : "calc(100% - 10px)",
        }}
        animate={{
          paddingRight: isServerMobile
            ? "0px"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "0px"
              : screensizelistener.W <= 900
                ? "20px"
                : "20px",
          paddingBottom: isServerMobile
            ? "0px"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          paddingTop: isServerMobile
            ? "0px"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          width: isServerMobile
            ? "100%"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 20px)"
                : "calc(100% - 20px)",
          height: isServerMobile
            ? "100%"
            : pathnamelistener.includes("messages") || isServerConversation
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 10px)"
                : "calc(100% - 10px)",
        }}
        id="div_conversation_container"
      >
        <motion.div
          initial={{
            height: isServerMobile ? "100%" : "0px",
            borderRadius: isServerMobile
              ? "0px"
              : pathnamelistener.includes("messages")
                ? "0px"
                : screensizelistener.W <= 900
                  ? "10px"
                  : "10px",
            border: isServerConversation
              ? "none"
              : "solid 1px var(--border)",
            paddingBottom: isServerMobile
              ? "0px"
              : isServerConversation && screensizelistener.W <= 900
                ? "0px"
                : "5px",
            paddingTop: isServerMobile
              ? "0px"
              : isServerConversation && screensizelistener.W <= 900
                ? "0px"
                : "5px",
            width: isServerMobile ? "100%" : "100%",
            boxSizing: "border-box",
          }}
          animate={{
            height: isServerMobile
              ? "100%"
              : isServerConversation && screensizelistener.W <= 900
                ? "100%"
                : "calc(100% - 10px)",
            borderRadius: isServerMobile
              ? "0px"
              : pathnamelistener.includes("messages")
                ? "0px"
                : screensizelistener.W <= 900
                  ? "10px"
                  : "10px",
            border: isServerConversation
              ? "none"
              : "solid 1px var(--border)",
            paddingBottom: isServerMobile
              ? "0px"
              : isServerConversation && screensizelistener.W <= 900
                ? "0px"
                : "5px",
            paddingTop: isServerMobile
              ? "0px"
              : isServerConversation && screensizelistener.W <= 900
                ? "0px"
                : "5px",
            width: "100%",
          }}
          id="div_conversation_content_handler"
          className={`tw-border-[0px] ${isMinimized && "tw-shadow-md tw-border-[1px] tw-border-[var(--border)]"}`}
        >
          <motion.div
            initial={{
              paddingLeft: isServerConversation
                ? screensizelistener.W <= 900
                  ? "0px"
                  : "10px"
                : "10px",
            }}
            animate={{
              paddingLeft: isServerConversation
                ? screensizelistener.W <= 900
                  ? "0px"
                  : "10px"
                : "10px",
            }}
            id="div_conversation_header"
          >
            <div id="div_conversation_user">
              {screensizelistener.W <= 900 && (
                <div
                  onClick={() => {
                    // console.log(conversationsetup);
                    navigate(
                      urllocation.pathname
                        .split("/")
                        .slice(0, urllocation.pathname.split("/").length - 1)
                        .join("/"),
                    );
                  }}
                  id="div_img_cncts_container"
                >
                  <div id="div_img_server_back_container_cncts">
                    <IoArrowBack style={{ fontSize: "20px" }} />
                  </div>
                </div>
              )}
              <div id="div_conversation_user_name">
                {
                  <span className="span_userdetails_name tw-flex tw-items-center tw-gap-[3px]">
                    {conversationsetup.groupdetails.privacy ? (
                      <AiFillSound />
                    ) : (
                      <AiOutlineSound />
                    )}{" "}
                    {conversationsetup.groupdetails.groupName}
                  </span>
                }
                <span className="span_userdetails_name">
                  Members are active
                </span>
              </div>
            </div>
            <div className="tw-relative">
              <motion.button
                className="btn_conversation_header_navigation cl-conversation-header-action--server"
                onClick={() => {
                  settoggleMenu(!toggleMenu);
                }}
              >
                <BiSolidInfoCircle style={{ fontSize: "20px" }} />
              </motion.button>
              <motion.div
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale: toggleMenu ? 1 : 0,
                }}
                className="cl-conversation-menu cl-conversation-menu--server tw-flex-col tw-absolute tw-top-[30px] tw-min-w-[80px] tw-right-0 tw-rounded-md tw-p-[5px] tw-shadow-md tw-z-50"
              >
                {conversationsetup.groupdetails.is_admin && (
                  <motion.button
                    className="cl-conversation-menu-action cl-conversation-menu-action--accent cl-conversation-menu-action--server tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                    onClick={() => {
                      settoggleMenu(false);
                      navigate(
                        `/realms/${conversationsetup.groupdetails.groupID}`,
                      );
                    }}
                  >
                    <IoMdSettings style={{ fontSize: "18px" }} />
                    <span className="tw-text-[11px] tw-font-Inter">Manage</span>
                  </motion.button>
                )}
                {conversationsetup.groupdetails.privacy && (
                  <motion.button
                    className="cl-conversation-menu-action cl-conversation-menu-action--danger tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                    disabled={isLeaving}
                    onClick={() => {
                      LeaveVoiceChannelProcess();
                    }}
                  >
                    <BiLogOut style={{ fontSize: "18px" }} />
                    <span className="tw-text-[11px] tw-font-Inter">
                      Leave Channel
                    </span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
          <div className="tw-h-full tw-w-full">
            <VoiceWindow
              key={conversationID}
              data={{
                ...conversationsetup,
                type: "audio",
                conversationID: conversationID,
                isGroup: true,
                conversationType: "group",
                callType: "audio",
                caller: {
                  name: authentication.user.fullName.firstName,
                  entityID: authentication.user.entity_id,
                },
                recepients,
                instance: instance,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default VoiceChannel;
