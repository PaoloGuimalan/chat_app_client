/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "../../../styles/styles.css";
import { motion } from "framer-motion";
import { RxEnterFullScreen } from "react-icons/rx";
import {
  BsFillMicFill,
  BsFillMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
} from "react-icons/bs";
import { HiPhoneMissedCall } from "react-icons/hi";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { END_CALL_LIST } from "@/redux/types";
import UserVideoBlock from "./UserVideoBlock";

function CallWindow({ data, lineNum }: any) {
  const [mediaStream, setmediaStream] = useState<MediaStream | null>(null);
  const [enableMic, setenableMic] = useState<boolean>(true);
  const [enableCamera, setenableCamera] = useState<boolean>(
    data.type === "video",
  );

  const dispatch = useDispatch();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((value) => {
        setmediaStream(value);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <motion.div
      initial={{
        top: `${20 * lineNum == 0 ? 5 : 20 * lineNum}px`,
        left: `${20 * lineNum == 0 ? 5 : 20 * lineNum}px`,
      }}
      animate={{
        maxWidth: "100%",
        minHeight: "100%",
        top: "0px",
        left: "0px",
        borderRadius: "0px",
        borderWidth: "0px",
      }}
      id="div_call_indv"
    >
      <div id="div_top_nav_call_window">
        <span id="span_call_displayname">{data.callDisplayName}</span>
        <button
          onClick={() => {
            // sendVideoData()
          }}
          className="btn_top_nav_call_window"
        >
          <RxEnterFullScreen style={{ fontSize: "20px", color: "white" }} />
        </button>
      </div>
      <div className="div_video_blocks_holder">
        {mediaStream && <UserVideoBlock mediaStream={mediaStream} />}
      </div>
      <div id="div_call_controls">
        <button
          onClick={() => {
            setenableMic(!enableMic);
          }}
          className={`btn_call_controls ${enableMic ? "" : "btn_call_controls_enable"}`}
        >
          {enableMic ? <BsFillMicFill /> : <BsFillMicMuteFill />}
        </button>
        <button
          onClick={() => {
            setenableCamera(!enableCamera);
          }}
          className={`btn_call_controls ${enableCamera ? "" : "btn_call_controls_enable"}`}
        >
          {enableCamera ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
        </button>
        <button
          onClick={() => {
            // endCallProcess();
            mediaStream?.getTracks().map((mp) => {
              mp.stop();
            });
            dispatch({
              type: END_CALL_LIST,
              payload: {
                callID: data.conversationid,
              },
            });
          }}
          className="btn_call_controls btn_call_controls_end"
        >
          <HiPhoneMissedCall />
        </button>
      </div>
    </motion.div>
  );
}

export default CallWindow;
