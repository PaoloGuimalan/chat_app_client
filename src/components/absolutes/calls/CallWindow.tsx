import { useEffect, useState } from 'react'
import '../../../styles/absolutes/index.css'
import { motion, useDragControls } from 'framer-motion'
import { RxEnterFullScreen } from 'react-icons/rx'
import { BsFillMicFill, BsFillMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { HiPhoneMissedCall } from 'react-icons/hi'
import { useDispatch, useSelector } from 'react-redux'
import { END_CALL_LIST, MEDIA_TRACK_HOLDER, REMOVE_REJECTED_CALL_LIST } from '../../../redux/types'
import { endSocket, socketCloseCall, socketConversationInit, socketInit, socketSendData } from '../../../reusables/hooks/sockets'
import { EndCallRequest } from '../../../reusables/hooks/requests'
import CallVideoBlocks from './CallVideoBlocks'

function CallWindow({ data, lineNum }: any) {

  const mediatrackholder = useSelector((state: any) => state.mediatrackholder);
  const mediamyvideoholder = useSelector((state: any) => state.mediamyvideoholder);
  const callslist = useSelector((state: any) => state.callslist);
  const rejectcalls = useSelector((state: any) => state.rejectcalls);
  const authentication = useSelector((state: any) => state.authentication);

  const [isAnswered, setisAnswered] = useState(false);
  const [isFullScreen, setisFullScreen] = useState(false);
  const [enableMic, setenableMic] = useState(true);
  const [enableCamera, setenableCamera] = useState(data.callType == "video"? true : false)
  const [testlistenerforsendata, settestlistenerforsendata] = useState(false);

  const dispatch = useDispatch()

  useEffect(() => {
    socketInit().then(() => {
      socketConversationInit({
        conversationID: data.conversationID,
        userID: authentication.user.userID
      }, (data: any) => {
        if(data.length > 1){
          setisAnswered(true);
        }

        settestlistenerforsendata(!testlistenerforsendata)
      })
    })
  },[])

  useEffect(() => {
    if(isAnswered && mediamyvideoholder){ /** isAnswered by default and ! only for testing  */
      sendVideoData()
    }
  },[isAnswered, mediamyvideoholder, testlistenerforsendata])

  useEffect(() => {
    if(rejectcalls.includes(data.conversationID)){
      dispatch({
          type: REMOVE_REJECTED_CALL_LIST,
          payload: {
            callID: data.conversationID
          }
      })
      endCallProcess();
    }
  },[callslist, rejectcalls])

  useEffect(() => {
    var timeout: any;

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
  
  const dragCallWindow = (event: any) => {
    dragcontrol.start(event)
  }

  const sendVideoData = () => {
    socketSendData({
      conversationID: data.conversationID,
      userID: authentication.user.userID,
      stream: mediamyvideoholder
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

    if(data.conversationType == 'single'){
      if(data.caller.userID == authentication.user.userID){
        EndCallRequest({
          conversationType: data.conversationType, 
          conversationID: data.conversationID,
          recepients: data.recepients.filter((flt: any) => flt != authentication.user.userID)
        });
      }
      else{
        EndCallRequest({
          conversationType: data.conversationType, 
          conversationID: data.conversationID,
          recepients: [data.caller.userID]
        });
      }
    }
    else{
      if(data.caller.userID == authentication.user.userID){
        EndCallRequest({
          conversationType: data.conversationType, 
          conversationID: data.conversationID,
          recepients: data.recepients.filter((flt: any) => flt != authentication.user.userID)
        });
      }
    }

    dispatch({
      type: END_CALL_LIST,
      payload: {
        callID: data.conversationID
      }
    })

    if(callslist.length == 1){
      mediatrackholder.map((mp: any) => {
        mp.stop()
      })
  
      dispatch({
        type: MEDIA_TRACK_HOLDER,
        payload: {
            mediatrackholder: []
        }
      })
    }
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
      maxWidth: isFullScreen? "100%" : "300px",
      minHeight: isFullScreen? "100%" : "170px",
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
        {isAnswered? (  /** isAnswered by default and ! only for testing  */
          <div className='div_video_blocks_holder'>
            <CallVideoBlocks />
            {/* {isFullScreen && (
              <CallVideoBlocks />
            )} */}
          </div>
        ) : (
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
            endCallProcess();
          }} className='btn_call_controls btn_call_controls_end'>
            <HiPhoneMissedCall />
          </button>
        </div>
    </motion.div>
  )
}

export default CallWindow