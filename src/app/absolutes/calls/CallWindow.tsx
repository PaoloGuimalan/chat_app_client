import React, { useCallback, useEffect, useState } from 'react'
import '../../../styles/styles.css'
import { motion, useDragControls } from 'framer-motion'
import { RxEnterFullScreen } from 'react-icons/rx'
import { BsFillMicFill, BsFillMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { HiPhoneMissedCall } from 'react-icons/hi'
import { useDispatch, useSelector } from 'react-redux'
import { END_CALL_LIST, MEDIA_TRACK_HOLDER, REMOVE_REJECTED_CALL_LIST } from '../../../redux/types'
import { endSocket, socket, socketCloseCall, socketConversationInit, socketEmitNewAnswer, socketInit, socketSendIceCandidate, socketSendNewOffer } from '../../../reusables/hooks/sockets'
import { EndCallRequest } from '../../../reusables/hooks/requests'
import CallVideoBlocks from './CallVideoBlocks'
import PeerService from '@/reusables/hooks/peer'
import { AuthenticationInterface } from '@/reusables/vars/interfaces' //RemoteStreams
import RemoteCallVideoBlocks from './RemoteCallVideoBlocks'

function CallWindow({ data, lineNum }: any) {

  const mediatrackholder = useSelector((state: any) => state.mediatrackholder);
  const mediamyvideoholder = useSelector((state: any) => state.mediamyvideoholder);
  const callslist = useSelector((state: any) => state.callslist);
  const rejectcalls = useSelector((state: any) => state.rejectcalls);
  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);

  const [isAnswered, setisAnswered] = useState(false);
  const [isFullScreen, setisFullScreen] = useState(false);
  const [enableMic, setenableMic] = useState(true);
  const [enableCamera, setenableCamera] = useState(data.callType == "video"? true : false)

  const [currentusers, setcurrentusers] = useState<any[]>([]);
  const [isCaller, setisCaller] = useState<boolean | null>(null);
  // const [remoteStreams, setremoteStreams] = useState<RemoteStreams[]>([]);
  const [remoteStream, setremoteStream] = useState<any | null>(null);

  const [isOfferReceived, setisOfferReceived] = useState<any | null>(null);
  const [icecandidatestrigger, seticecandidatestrigger] = useState<any | null>(null);
  const [answerresponsetrigger, setanswerresponsetrigger] = useState<any | null>(null)

  const [localGlobalPeer, setlocalGlobalPeer] = useState<typeof PeerService | null>(null);

  const dispatch = useDispatch()

  const handleIceCandidate = useCallback((e: any) =>{
      console.log('........Ice candidate found!......')
      console.log(e)
      if(e.candidate){
          console.log("CANDIDATE", e.candidate);
          if(isCaller !== null){
            socketSendIceCandidate({
                conversationID: data.conversationID,
                iceCandidate: e.candidate,
                iceUserName: authentication.user.userID,
                didIOffer: isCaller,
            }) 
          }   
      }
  },[socket, isCaller])

  // console.log(socket);

  const createPeerConnection = async (userdata?: any) => {
      const peer = PeerService;
      const pendingRemoteStream = new MediaStream();
      setremoteStream(pendingRemoteStream);

      mediatrackholder.map((mp: any) => {
        peer.peer?.addTrack(mp, mediamyvideoholder);
      })
  
      peer.peer?.addEventListener("signalingstatechange", (event) => {
          console.log(event);
          console.log(peer.peer?.signalingState);
      });
  
      peer.peer?.addEventListener('icecandidate', handleIceCandidate)
  
      peer.peer?.addEventListener('track', (e: any) =>{
          console.log("Got a track from the other peer!! How excting")
          console.log(e)

          setremoteStream(e.streams[0])
          
          // setremoteStreams((prev: RemoteStreams[]) => [
          //   ...prev,
          //   {
          //     userID: "",
          //     mediastreamid: "",
          //     stream: e.streams[0],
          //   }
          // ])

          // e.streams[0].getTracks().forEach((track: any)=>{
          //     console.log(track);
          //     console.log("Here's an exciting moment... fingers cross")
          // })
      })

      if(userdata){
        peer.peer?.setRemoteDescription(userdata.offer);
      }

      setlocalGlobalPeer(peer);
      return peer;
  }

  const callerPeerInit = async () => {
    const peer = await createPeerConnection();

    try{
        console.log("Creating offer...")
        const offer = await peer.peer?.createOffer();
        console.log(offer);
        peer.peer?.setLocalDescription(offer);
        socketSendNewOffer({
          conversationID: data.conversationID,
          userID: authentication.user.userID,
          offer: offer
        }) //send offer to signalingServer
    }catch(err){
        console.log(err)
    }
  }

  const answerOffer = async(offerObj: any)=>{
      const peer = await createPeerConnection(offerObj);
      const answer = await peer.peer?.createAnswer({}); //just to make the docs happy
      await peer.peer?.setLocalDescription(answer); //this is CLIENT2, and CLIENT2 uses the answer as the localDesc
      console.log(offerObj)
      console.log(answer)
      // console.log(peerConnection.signalingState) //should be have-local-pranswer because CLIENT2 has set its local desc to it's answer (but it won't be)
      //add the answer to the offerObj so the server knows which offer this is related to
      offerObj.answer = answer 
      offerObj.userName = authentication.user.userID
      //emit the answer to the signaling server, so it can emit to CLIENT1
      //expect a response from the server with the already existing ICE candidates
      console.log(offerObj)
      const offerIceCandidates = await socketEmitNewAnswer(offerObj);
      offerIceCandidates.forEach((c: any) => {
          peer.peer?.addIceCandidate(c);
          console.log("======Added Ice Candidate======")
      })
      console.log(offerIceCandidates)
  }

  useEffect(() => {
    if(mediamyvideoholder && mediatrackholder){
      socketInit().then(() => {
        socketConversationInit({
          conversationID: data.conversationID,
          userID: authentication.user.userID
        },(data: any) => {
          console.log(data)
          setcurrentusers(data);
          setisAnswered(true);
        },(data: any) => {
          console.log("RECEIVED AN OFFER FROM CALLER", data);
          setisOfferReceived(data);
        }, (data: any) => {
          //NEW CALLER
          // console.log("NEW CALLER SOCKET", data);
          setcurrentusers(data);
        }, (data: any) => {
          // ANSWER RESPONSE
          console.log("ANSWER RESPONSE", data);
          setanswerresponsetrigger(data.answer);
        }, (data: any) => {
          // ADD NEW ICE CANDIDATE
          console.log("ADD NEW ICE CANDIDATE", data);
          seticecandidatestrigger(data);
        })
      })
    }
  },[mediamyvideoholder, mediatrackholder]);

  useEffect(() => {
    if(icecandidatestrigger && localGlobalPeer){
      localGlobalPeer.peer?.addIceCandidate(icecandidatestrigger);
    }
  },[icecandidatestrigger, localGlobalPeer])

  useEffect(() => {
    if(localGlobalPeer && answerresponsetrigger){
      localGlobalPeer.peer?.setRemoteDescription(answerresponsetrigger);
    }
  },[localGlobalPeer, answerresponsetrigger])

  useEffect(() => {
    if(isCaller !== null){
      if(isOfferReceived){
        answerOffer(isOfferReceived);
      }
    }
  },[isCaller, isOfferReceived])

  useEffect(() => {
    if(isCaller === null && currentusers.length !== 0){
      if(currentusers.length > 1){
        setisCaller(false);
        console.log("I AM ANSWERE", currentusers.length)
      }
      else{
        setisCaller(true);
        // callerPeerInit();
        console.log("I AM CALLER", currentusers.length)
      }
    }
    else{
      if(currentusers.length > 1){
        // console.log("NEW CALLER", currentusers);
        if(isCaller){
          callerPeerInit();
        }
      }
    }
  },[currentusers, isCaller]);

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

  // const sendStreams = () => {
  //   mediatrackholder.map((mp: any) => {
  //     localGlobalPeer?.peer?.addTrack(mp, mediamyvideoholder);
  //   })
  // }

  return (
    <motion.div
    drag={!isFullScreen}
    dragConstraints={{top: 0, bottom: windowHeight - 185, left: 0, right: windowWidth - 315}}
    dragControls={dragcontrol}
    onPointerDown={dragCallWindow}
    // onClick={sendStreams}
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
            // sendVideoData()
            setisFullScreen(!isFullScreen)
          }}
          className='btn_top_nav_call_window'>
            <RxEnterFullScreen style={{ fontSize: "20px", color: "white" }} />
          </button>
        </div>
        {isAnswered? (  /** isAnswered by default and ! only for testing  */
          <div className='div_video_blocks_holder'>
            {/* {remoteStreams.map((mp: RemoteStreams, i: number) => {
              return(
                <RemoteCallVideoBlocks key={i} remoteStream={mp.stream} />
              )
            })} */}
            {!isFullScreen ? (
              <RemoteCallVideoBlocks remoteStream={remoteStream} />
            ) : (
              <React.Fragment>
                <CallVideoBlocks/>
                {remoteStream && (
                  <RemoteCallVideoBlocks remoteStream={remoteStream} />
                )}
              </React.Fragment>
            )}
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