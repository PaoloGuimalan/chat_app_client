/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import "../../App.css";
import GroupChatIcon from "../../assets/imgs/group-chat-icon.jpg";
import { Avatar } from "../../reusables/design/primitives2";
import { motion } from "framer-motion";
import {
  AiFillCheckCircle,
  AiFillInfoCircle,
  AiFillWarning,
} from "react-icons/ai";
import { IoMdClose, IoMdCloseCircle } from "react-icons/io";
import { BiSolidPhoneCall } from "react-icons/bi";
import { HiPhoneMissedCall } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { callalert } from "../../reusables/hooks/soundmodules";
import alert_incoming_call from "../../assets/sounds/alert_call_tune.mp3";
import {
  CHECK_AND_ADD_NEW_CALL_LIST_WINDOW,
  // MEDIA_MY_VIDEO_HOLDER,
  // MEDIA_TRACK_HOLDER,
  REMOVE_PENDING_CALL_ALERTS,
  REMOVE_REJECTED_CALL_LIST,
} from "../../redux/types";
import { RejectCallRequest } from "../../reusables/hooks/requests";
import {
  isInAnyCall,
  subscribeCallPresence,
} from "../../reusables/hooks/callPresence";
import CachedImage from "../reusables/cachers/CachedImage";

function Alert({ al }: any) {
  const alerts = useSelector((state: any) => state.alerts);
  // const mediatrackholder = useSelector((state: any) => state.mediatrackholder);
  const rejectcalls = useSelector((state: any) => state.rejectcalls);
  const [timerUnToggle, settimerUnToggle] = useState(true);
  const [displayUntoggle, setdisplayUntoggle] = useState(true);
  const [onStop, setonStop] = useState(false);

  const dispatch = useDispatch();

  let audioMessage: any = new Audio(alert_incoming_call);
  const callinstancetune: any = new callalert(audioMessage);

  audioMessage.pause();
  callinstancetune.stop();

  const callaudiomonocontrol = () => {
    return {
      start: () => {
        callinstancetune.start();
      },
      stop: () => {
        callinstancetune.stop();
      },
    };
  };

  // Busy-ness that begins while this alert is ALREADY ringing - the user
  // answered a different call, or walked into a voice channel, during the
  // 60 seconds this one rings for. sse.ts suppresses alerts that arrive
  // while busy; this covers the opposite order.
  //
  // "ended", not "rejected", so nothing is sent to the caller: they keep
  // ringing, and this user's other devices keep their chance to answer.
  useEffect(() => {
    if (al.type != "incomingcall") return;
    const stopIfBusy = () => {
      if (isInAnyCall()) rejectCallProcess("ended");
    };
    stopIfBusy();
    return subscribeCallPresence(stopIfBusy);
  }, [al]);

  useEffect(() => {
    if (al.type == "incomingcall") {
      if (rejectcalls.includes(al.callmetadata.conversationID)) {
        dispatch({
          type: REMOVE_REJECTED_CALL_LIST,
          payload: {
            callID: al.callmetadata.conversationID,
          },
        });
        rejectCallProcess("ended");
      }
    }
  }, [alerts, rejectcalls]);

  useEffect(() => {
    if (al.type != "incomingcall") {
      setTimeout(() => {
        settimerUnToggle(false);
      }, 3000);
      setTimeout(() => {
        setdisplayUntoggle(false);
      }, 3500);
    } else {
      if (!onStop) {
        if (audioMessage) callaudiomonocontrol().start();
        setTimeout(() => {
          if (audioMessage) callaudiomonocontrol().stop();
          settimerUnToggle(false);
        }, 60000);
        setTimeout(() => {
          setdisplayUntoggle(false);
          audioMessage = null;
          dispatch({
            type: REMOVE_PENDING_CALL_ALERTS,
            payload: {
              callID: al.callmetadata.conversationID,
            },
          });
        }, 60500);
      }
    }

    return () => {
      callaudiomonocontrol().stop();
    };
  }, [onStop]);

  const alertIcons: any = {
    success: {
      title: "Success",
      component: (
        <AiFillCheckCircle style={{ fontSize: "25px", color: "white" }} />
      ),
    },
    info: {
      title: "Info",
      component: (
        <AiFillInfoCircle style={{ fontSize: "25px", color: "white" }} />
      ),
    },
    warning: {
      title: "Warning",
      component: <AiFillWarning style={{ fontSize: "25px", color: "white" }} />,
    },
    error: {
      title: "Error",
      component: (
        <IoMdCloseCircle style={{ fontSize: "25px", color: "white" }} />
      ),
    },
    incomingcall: {
      title: "Incoming Call",
      component: null,
    },
  };

  // const initMediaDevices = (callmetadata: any) => {
  //   if (mediatrackholder.length > 0) {
  //     acceptCallProcess(callmetadata);
  //   } else {
  //     navigator.mediaDevices
  //       .getUserMedia({
  //         video: true,
  //         audio: true,
  //       })
  //       .then((value) => {
  //         dispatch({
  //           type: MEDIA_MY_VIDEO_HOLDER,
  //           payload: {
  //             mediamyvideoholder: value,
  //           },
  //         });
  //         dispatch({
  //           type: MEDIA_TRACK_HOLDER,
  //           payload: {
  //             mediatrackholder: value.getTracks(),
  //           },
  //         });
  //         acceptCallProcess(callmetadata);
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   }
  // };

  // const acceptCallProcess = (callmetadata: any) => {
  //   setonStop(true);
  //   audioMessage.pause();
  //   callinstancetune.stop();
  //   if (audioMessage) callaudiomonocontrol().stop();
  //   settimerUnToggle(false);
  //   setTimeout(() => {
  //     setdisplayUntoggle(false);
  //     audioMessage = null;
  //   }, 500);
  //   dispatch({
  //     type: REMOVE_PENDING_CALL_ALERTS,
  //     payload: {
  //       callID: al.callmetadata.conversationID,
  //     },
  //   });

  //   dispatch({
  //     type: CHECK_AND_ADD_NEW_CALL_LIST_WINDOW,
  //     payload: {
  //       callmetadata: callmetadata,
  //     },
  //   });
  // };

  const rejectCallProcess = (trigger: any) => {
    setonStop(true);
    audioMessage.pause();
    callinstancetune.stop();
    if (audioMessage) callaudiomonocontrol().stop();
    settimerUnToggle(false);
    setTimeout(() => {
      setdisplayUntoggle(false);
      audioMessage = null;
    }, 500);
    dispatch({
      type: REMOVE_PENDING_CALL_ALERTS,
      payload: {
        callID: al.callmetadata.conversationID,
      },
    });

    if (trigger == "rejected") {
      RejectCallRequest({
        conversationType: al.callmetadata.conversationType,
        conversationID: al.callmetadata.conversationID,
        caller: al.callmetadata.caller,
      });
    }
  };

  const initializeCall = (conversationsetup: any) => {
    setonStop(true);
    audioMessage.pause();
    callinstancetune.stop();
    if (audioMessage) callaudiomonocontrol().stop();
    settimerUnToggle(false);
    setTimeout(() => {
      setdisplayUntoggle(false);
      audioMessage = null;
    }, 500);
    dispatch({
      type: REMOVE_PENDING_CALL_ALERTS,
      payload: {
        callID: al.callmetadata.conversationID,
      },
    });

    dispatch({
      type: CHECK_AND_ADD_NEW_CALL_LIST_WINDOW,
      payload: {
        callmetadata: conversationsetup,
      },
    });
  };

  return al.type == "incomingcall" ? (
    <motion.div
      initial={{
        marginLeft: "-800px",
      }}
      animate={{
        marginLeft: timerUnToggle ? "0px" : "-800px",
        display: displayUntoggle ? "flex" : "none",
      }}
      className={`div_alerts_prompt ${al.type} tw-z-[3]`}
    >
      <div id="div_header_alert">
        {alertIcons[al.type].component}
        <span id="span_header_label_ic">
          {alertIcons[al.type].title} (
          {al.callmetadata.callType == "audio" ? "Audio" : "Video"})
        </span>
        <div id="div_close_alert_container_ic">
          <button
            onClick={() => {
              // initMediaDevices(al.callmetadata);
              initializeCall(al.callmetadata);
            }}
            id="btn_close_alert"
          >
            <BiSolidPhoneCall style={{ fontSize: "25px", color: "#45EF56" }} />
          </button>
          <button
            onClick={() => {
              rejectCallProcess("rejected");
            }}
            id="btn_close_alert"
          >
            <HiPhoneMissedCall style={{ fontSize: "25px", color: "red" }} />
          </button>
        </div>
      </div>
      <div id="div_alert_content_container_ic">
        <div id="div_img_alert_container">
          {al.callmetadata.conversationType == "single" ? (
            <Avatar
              id={al.callmetadata.caller}
              src={
                al.callmetadata.displayImage == "none"
                  ? undefined
                  : al.callmetadata.displayImage
              }
              size={50}
            />
          ) : (
            <CachedImage src={GroupChatIcon} className="img_gc_profiles_ntfs" />
          )}
        </div>
        <p id="p_alert_content_ic">{al.content}</p>
      </div>
    </motion.div>
  ) : (
    <motion.div
      initial={{
        marginLeft: "-800px",
      }}
      animate={{
        marginLeft: timerUnToggle ? "0px" : "-800px",
        display: displayUntoggle ? "flex" : "none",
      }}
      className={`div_alerts_prompt ${al.type} tw-z-[3]`}
    >
      <div id="div_header_alert">
        {alertIcons[al.type].component}
        <span id="span_header_label">{alertIcons[al.type].title}</span>
        <div id="div_close_alert_container">
          <button id="btn_close_alert">
            <IoMdClose
              style={{ fontSize: "20px", color: "white", fontWeight: "bold" }}
            />
          </button>
        </div>
      </div>
      <div id="div_alert_content_container">
        <p id="p_alert_content" className="tw-text-left">
          {al.content}
        </p>
      </div>
    </motion.div>
  );
}

export default Alert;
