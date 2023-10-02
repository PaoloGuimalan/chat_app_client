import React, { useEffect, useState } from 'react'
import '../../../styles/absolutes/index.css'
import { motion, useDragControls } from 'framer-motion'
import { RiDragMoveLine } from 'react-icons/ri'
import { BsBoxArrowUpRight } from 'react-icons/bs'
import { RxEnterFullScreen } from 'react-icons/rx'
import { BsFillMicFill, BsFillMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { HiPhoneMissedCall } from 'react-icons/hi'
import { useDispatch, useSelector } from 'react-redux'
import { SET_CALLS_LIST } from '../../../redux/types'
import { endSocket, socketCloseCall, socketConversationInit, socketInit, socketSendData } from '../../../reusables/hooks/sockets'

function CallWindow({ data, lineNum }) {

  const callslist = useSelector(state => state.callslist);
  const authentication = useSelector(state => state.authentication)

  const [isFullScreen, setisFullScreen] = useState(false);
  const [enableMic, setenableMic] = useState(true);
  const [enableCamera, setenableCamera] = useState(data.callType == "video"? true : false)

  const dispatch = useDispatch()

  useEffect(() => {
    socketInit().then(() => {
      socketConversationInit({
        conversationID: data.conversationID,
        userID: authentication.user.userID
      })
    })
  },[])

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const dragcontrol = useDragControls()
  
  const dragCallWindow = (event) => {
    dragcontrol.start(event)
  }

  const sendVideoData = () => {
    socketSendData({
      conversationID: data.conversationID,
      userID: authentication.user.userID
    })
  }

  const endCallProcess = () => {
    const newCallsList = callslist.filter((onc) => onc.conversationID != data.conversationID);

    if(callslist.length == 1){
      socketCloseCall({
        conversationID: data.conversationID,
        userID: authentication.user.userID
      }).then(() => {
        endSocket()
      })
    }
    else{
      socketCloseCall({
        conversationID: data.conversationID,
        userID: authentication.user.userID
      })
    }

    dispatch({
      type: SET_CALLS_LIST,
      payload: {
        callslist: newCallsList
      }
    })
  }

  return (
    <motion.div
    drag={!isFullScreen}
    dragConstraints={{top: 0, bottom: windowHeight - 185, left: 0, right: windowWidth - 315}}
    dragControls={dragcontrol}
    onPointerDown={dragCallWindow}
    initial={{
      top: `${20*lineNum == 0? 5 : 20*lineNum}px`,
      left: `${20*lineNum == 0? 5 : 20*lineNum}px`,
    }}
    animate={{
      maxWidth: isFullScreen? "100vw" : "300px",
      minHeight: isFullScreen? "100vh" : "170px",
      top: isFullScreen? "0px" : `${20*lineNum == 0? 5 : 20*lineNum}px`,
      left: isFullScreen? "0px" : `${20*lineNum == 0? 5 : 20*lineNum}px`,
      borderRadius: isFullScreen? "0px" : "5px",
      borderWidth: isFullScreen? "0px" : "1px"
    }}
    id='div_call_indv'>
        <div id='div_top_nav_call_window'>
          <span id='span_call_displayname'>{data.callDisplayName}</span>
          <button
          onClick={() => {
            sendVideoData()
            setisFullScreen(!isFullScreen)
          }}
          className='btn_top_nav_call_window'>
            <RxEnterFullScreen style={{ fontSize: "20px", color: "white" }} />
          </button>
        </div>
        <div id='div_call_controls'>
          <button
          onClick={() => {
            setenableMic(!enableMic)
          }}
          className={`btn_call_controls ${enableMic? '' : 'btn_call_controls_enable'}`}>
            {enableMic? (
              <BsFillMicFill />
            ) : (
              <BsFillMicMuteFill />
            )}
          </button>
          <button
          onClick={() => {
            setenableCamera(!enableCamera)
          }}
          className={`btn_call_controls ${enableCamera? '' : 'btn_call_controls_enable'}`}>
            {enableCamera? (
              <BsCameraVideoFill />
            ) : (
              <BsCameraVideoOffFill />
            )}
          </button>
          <button onClick={() => {
            endCallProcess()
          }} className='btn_call_controls btn_call_controls_end'>
            <HiPhoneMissedCall />
          </button>
        </div>
    </motion.div>
  )
}

export default CallWindow