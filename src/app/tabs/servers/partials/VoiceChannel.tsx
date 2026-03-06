/* eslint-disable @typescript-eslint/no-explicit-any */
import VoiceWindow from "@/app/absolutes/calls_v2/VoiceWindow";
import {
  AuthenticationInterface,
  IUserInterface,
} from "@/reusables/vars/interfaces";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { AiFillSound, AiOutlineSound } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

function VoiceChannel({ conversationsetup, users, isMinimized }: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);

  const conversationType = useMemo(
    () => conversationsetup.type,
    [conversationsetup],
  );

  const navigate = useNavigate();

  const urllocation = useLocation();

  const recepients = useMemo(
    () => users.map((mp: IUserInterface) => mp.userID),
    [users],
  );

  return (
    <motion.div
      animate={{
        display:
          pathnamelistener.includes("messages") || conversationType === "server"
            ? "flex"
            : screensizelistener.W <= 900
              ? "none"
              : "flex",
        maxWidth:
          pathnamelistener.includes("messages") || conversationType === "server"
            ? "100%"
            : screensizelistener.W <= 900
              ? "350px"
              : "350px",
        paddingTop:
          pathnamelistener.includes("messages") || conversationType === "server"
            ? conversationType === "server"
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
          paddingRight:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "0px"
              : screensizelistener.W <= 900
                ? "20px"
                : "20px",
          paddingBottom:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          width:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 20px)"
                : "calc(100% - 20px)",
          height:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 10px)"
                : "calc(100% - 10px)",
        }}
        animate={{
          paddingRight:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "0px"
              : screensizelistener.W <= 900
                ? "20px"
                : "20px",
          paddingBottom:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          width:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 20px)"
                : "calc(100% - 20px)",
          height:
            pathnamelistener.includes("messages") ||
            conversationType === "server"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 10px)"
                : "calc(100% - 10px)",
        }}
        id="div_conversation_container"
      >
        <motion.div
          initial={{
            height: "0px",
            paddingBottom: "0px",
            paddingTop: "0px",
            borderRadius: pathnamelistener.includes("messages")
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
            border:
              conversationType === "server"
                ? "none"
                : "solid 1px rgb(210, 210, 210)",
          }}
          animate={{
            height: "calc(100% - 10px)",
            paddingBottom: "5px",
            paddingTop: "5px",
            borderRadius: pathnamelistener.includes("messages")
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          }}
          id="div_conversation_content_handler"
          className={`tw-border-[0px] ${
            isMinimized && "tw-shadow-md tw-border-[1px] tw-border-[#dedede]"
          }`}
        >
          <motion.div
            initial={{
              paddingLeft:
                conversationType === "server"
                  ? screensizelistener.W <= 900
                    ? "0px"
                    : "10px"
                  : "10px",
            }}
            animate={{
              paddingLeft:
                conversationType === "server"
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
          </motion.div>
          <div className="tw-bg-green-500 tw-h-full tw-w-full">
            <VoiceWindow
              key={conversationsetup.conversationID}
              data={{
                ...conversationsetup,
                type: "audio",
                conversationID: conversationsetup.conversationID,
                isGroup: true,
                conversationType: "group",
                callType: "audio",
                caller: {
                  name: authentication.user.fullName.firstName,
                  userID: authentication.user.userID,
                },
                recepients,
                instance: null,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default VoiceChannel;
