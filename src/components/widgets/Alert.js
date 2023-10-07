import React, { useEffect, useState } from 'react'
import '../../App.css'
import DefaultProfile from '../../assets/imgs/default.png'
import GroupChatIcon from '../../assets/imgs/group-chat-icon.jpg'
import { motion } from 'framer-motion';
import { AiFillCheckCircle, AiOutlineClose, AiFillInfoCircle, AiFillWarning, AiFillCloseCircle } from 'react-icons/ai'
import { IoMdClose, IoMdCloseCircle } from 'react-icons/io'
import { BiSolidPhoneCall } from 'react-icons/bi'
import { HiPhoneMissedCall } from 'react-icons/hi'
import { useDispatch, useSelector } from 'react-redux';
import { callalert } from '../../reusables/hooks/soundmodules';
import alert_incoming_call from '../../assets/sounds/alert_call_tune.mp3'
import { REMOVE_PENDING_CALL_ALERTS, REMOVE_REJECTED_CALL_LIST, SET_FILTERED_ALERTS, SET_PENDING_CALL_ALERTS } from '../../redux/types';
import { RejectCallRequest } from '../../reusables/hooks/requests';

function Alert({al}) {

  const alerts = useSelector(state => state.alerts)
  const rejectcalls = useSelector(state => state.rejectcalls);
  const [timerUnToggle, settimerUnToggle] = useState(true);
  const [displayUntoggle, setdisplayUntoggle] = useState(true);
  const [onStop, setonStop] = useState(false);

  const dispatch = useDispatch();
  
  var audioMessage = new Audio(alert_incoming_call);
  var callinstancetune = new callalert(audioMessage);

  audioMessage.pause()
  callinstancetune.stop()

  const callaudiomonocontrol = () => {
    return {
      start: () => {
        callinstancetune.start()
      },
      stop: () => {
        callinstancetune.stop()
      }
    }
  }

  useEffect(() => {
    if(rejectcalls.includes(al.callmetadata.conversationID)){
      dispatch({
          type: REMOVE_REJECTED_CALL_LIST,
          payload: {
            callID: al.callmetadata.conversationID
          }
      })
      rejectCallProcess("ended")
    }
  },[alerts, rejectcalls])

  useEffect(() => {
    if(al.type != "incomingcall"){
      setTimeout(() => {
          settimerUnToggle(false)
      }, 3000)
      setTimeout(() => {
          setdisplayUntoggle(false)
      },3500)
    }
    else{
      if(!onStop){
        if(audioMessage) callaudiomonocontrol().start()
        setTimeout(() => {
            if(audioMessage) callaudiomonocontrol().stop()
            settimerUnToggle(false)
        }, 60000)
        setTimeout(() => {
            setdisplayUntoggle(false)
            audioMessage = null;
            dispatch({
                type: REMOVE_PENDING_CALL_ALERTS,
                payload: {
                    callID: al.callmetadata.conversationID
                }
            })
        },60500)
      }
    }

    return () => {
      callaudiomonocontrol().stop()
    }
  }, [onStop])

  const alertIcons = {
    success: {
      title: "Success",
      component: <AiFillCheckCircle style={{ fontSize: "25px", color: "white" }} />
    },
    info: {
      title: "Info",
      component: <AiFillInfoCircle style={{ fontSize: "25px", color: "white" }} />
    },
    warning: {
      title: "Warning",
      component: <AiFillWarning style={{ fontSize: "25px", color: "white" }} />
    },
    error: {
      title: "Error",
      component: <IoMdCloseCircle style={{ fontSize: "25px", color: "white" }} />
    },
    incomingcall: {
      title: "Incoming Call",
      component: null
    }
  }

  const rejectCallProcess = (trigger) => {
    setonStop(true);
    audioMessage.pause()
    callinstancetune.stop()
    if(audioMessage) callaudiomonocontrol().stop()
    settimerUnToggle(false)
    setTimeout(() => {
        setdisplayUntoggle(false)
        audioMessage = null;
    },500)
    dispatch({
        type: REMOVE_PENDING_CALL_ALERTS,
        payload: {
            callID: al.callmetadata.conversationID
        }
    })
    
    if(trigger == "rejected"){
      RejectCallRequest({
        conversationType: al.callmetadata.conversationType, 
        conversationID: al.callmetadata.conversationID,
        caller: al.callmetadata.caller
      });
    }
  }

  return (
    al.type == "incomingcall"? (
      <motion.div
      initial={{
          marginLeft: "-800px"
      }}
      animate={{
          marginLeft: timerUnToggle? "0px" : "-800px",
          display: displayUntoggle? "flex" : "none"
      }}
      className={`div_alerts_prompt ${al.type}`}>
          <div id='div_header_alert'>
          {alertIcons[al.type].component}
          <span id='span_header_label_ic'>{alertIcons[al.type].title} ({al.callmetadata.callType == "audio"? "Audio" : "Video"})</span>
          <div id='div_close_alert_container_ic'>
              <button id='btn_close_alert'>
                <BiSolidPhoneCall style={{fontSize: "25px", color: "#45EF56"}} />
              </button>
              <button
              onClick={() => {
                rejectCallProcess("rejected")
              }}
              id='btn_close_alert'>
                <HiPhoneMissedCall style={{fontSize: "25px", color: "red"}} />
              </button>
          </div>
          </div>
          <div id='div_alert_content_container_ic'>
            <div id='div_img_alert_container'>
              {al.callmetadata.conversationType == "single"? (
                  <img src={al.callmetadata.displayImage == "none"? DefaultProfile : al.callmetadata.displayImage} className='img_search_profiles_ntfs' />
              ) : (
                  <img src={GroupChatIcon} className='img_gc_profiles_ntfs' />
              )}
            </div>
            <p id='p_alert_content_ic'>{al.content}</p>
          </div>
      </motion.div>
    ) : (
      <motion.div
      initial={{
          marginLeft: "-800px"
      }}
      animate={{
          marginLeft: timerUnToggle? "0px" : "-800px",
          display: displayUntoggle? "flex" : "none"
      }}
      className={`div_alerts_prompt ${al.type}`}>
          <div id='div_header_alert'>
          {alertIcons[al.type].component}
          <span id='span_header_label'>{alertIcons[al.type].title}</span>
          <div id='div_close_alert_container'>
              <button id='btn_close_alert'>
                <IoMdClose style={{ fontSize: "20px", color: "white", fontWeight: "bold" }} />
              </button>
          </div>
          </div>
          <div id='div_alert_content_container'>
          <p id='p_alert_content'>{al.content}</p>
          </div>
      </motion.div>
    )
  )
}

export default Alert