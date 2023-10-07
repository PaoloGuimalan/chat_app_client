import React, { useEffect, useState } from 'react'
import '../../../styles/absolutes/index.css'
import { motion, useDragControls } from 'framer-motion'
import { RiDragMoveLine } from 'react-icons/ri'
import { BsBoxArrowUpRight } from 'react-icons/bs'
import { RxEnterFullScreen } from 'react-icons/rx'
import { BsFillMicFill, BsFillMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { HiPhoneMissedCall } from 'react-icons/hi'
import { useDispatch, useSelector } from 'react-redux'
import { END_CALL_LIST, REMOVE_REJECTED_CALL_LIST, SET_CALLS_LIST } from '../../../redux/types'
import { endSocket, socketCloseCall, socketConversationInit, socketInit, socketSendData } from '../../../reusables/hooks/sockets'

function CallWindow({ data, lineNum }) {

  const callslist = useSelector(state => state.callslist);
  const rejectcalls = useSelector(state => state.rejectcalls);
  const authentication = useSelector(state => state.authentication)

  const [isAnswered, setisAnswered] = useState(false);
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

  useEffect(() => {
    if(rejectcalls.includes(data.conversationID)){
      dispatch({
          type: REMOVE_REJECTED_CALL_LIST,
          payload: {
            callID: data.conversationID
          }
      })
      endCallProcess()
    }
  },[callslist, rejectcalls])

  useEffect(() => {
    var timeout;

    if(!isAnswered){
      timeout = setTimeout(() => {
        socketCloseCall({
          conversationID: data.conversationID,
          userID: authentication.user.userID
        })

        dispatch({
          type: END_CALL_LIST,
          payload: {
            callID: data.conversationID
          }
        })
      },60000)
    }

    return () => {
      clearTimeout(timeout);
      timeout = null;
    }
  },[isAnswered])

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
      type: END_CALL_LIST,
      payload: {
        callID: data.conversationID
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
        {isAnswered? null : (
          data.conversationType == 'single'? (
            <div className='div_callwindow_content_not_answered'>
              <span className='span_callwindow_content_not_answered_label'>...waiting for {data.callDisplayName}</span>
            </div>
          ) : (
            <div className='div_callwindow_content_not_answered'>
              <span className='span_callwindow_content_not_answered_label'>...waiting for members to join</span>
            </div>
          )
        )}
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