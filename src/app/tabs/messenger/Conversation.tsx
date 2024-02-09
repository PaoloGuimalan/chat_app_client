import { useEffect, useRef, useState } from 'react'
import '../../../styles/styles.css'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'
import GroupChatIcon from '../../../assets/imgs/group-chat-icon.jpg'
import { FcVideoCall, FcInfo, FcAddImage } from 'react-icons/fc'
import { BiSolidPhoneCall } from 'react-icons/bi'
import { RiAddCircleFill } from 'react-icons/ri'
import { IoDocumentOutline, IoSend } from 'react-icons/io5'
import { MdAudiotrack } from "react-icons/md";
import { AiOutlineClose } from 'react-icons/ai';
import { checkIfValid } from '../../../reusables/hooks/validatevariables'
import { CallRequest, InitConversationRequest, SeenMessageRequest, SendFilesRequest, SendMessageRequest } from '../../../reusables/hooks/requests'
import { useDispatch, useSelector } from 'react-redux'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { importData, importNonImageData, isUserOnline, makeid } from '../../../reusables/hooks/reusable'
import { MEDIA_MY_VIDEO_HOLDER, MEDIA_TRACK_HOLDER, REMOVE_REJECTED_CALL_LIST, SET_CALLS_LIST, SET_MUTATE_ALERTS, SET_PENDING_MESSAGES_LIST } from '../../../redux/types'
import { useNavigate } from 'react-router-dom'
import ContentHandler from './partials/ContentHandler'

function Conversation({ conversationsetup }: any) {

  const authentication = useSelector((state: any) => state.authentication)
  const mediatrackholder = useSelector((state: any) => state.mediatrackholder);
  const pendingcallalerts = useSelector((state: any) => state.pendingcallalerts);
  const pendingmessageslist = useSelector((state: any) => state.pendingmessageslist)
  const messageslist = useSelector((state: any) => state.messageslist)
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener)
  const callslist = useSelector((state: any) => state.callslist);
  const activeuserslist = useSelector((state: any) => state.activeuserslist)
  const activeusersmapper = activeuserslist.map((mp: any) => mp._id);
  const activeuserSpecific = conversationsetup.type == "single" && activeuserslist.filter((flt: any) => flt._id == conversationsetup.userdetails.userID);

  const [messageValue, setmessageValue] = useState<string>("");
  const [conversationList, setconversationList] = useState<any[]>([])
  const [totalMessages, settotalMessages] = useState<number>(0);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [autoScroll, setautoScroll] = useState<boolean>(true)
  const [isReplying, setisReplying] = useState<any>({
    isReply: false,
    replyingTo: ""
  })
  const [imgList, setimgList] = useState<any[]>([]);
  const [rawFilesList, setrawFilesList] = useState<any[]>([])
  const [nonImgList, setnonImgList] = useState<any[]>([]);
  const [nonImageRawFilesList, setnonImageRawFilesList] = useState<any[]>([])

  const [range, setrange] = useState<number>(20);

  const [fullImageScreen, setfullImageScreen] = useState<any>({
    preview: "",
    toggle: false,
  })
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const divcontentRef = useRef<HTMLDivElement | null>(null);
  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if(!isLoading){
//         if(divcontentRef){
//             console.log(divcontentRef.current.clientHeight, divcontentRef.current.scrollHeight)
//         }
//     }
//   },[conversationsetup, messageslist, divcontentRef, isLoading])

  const scrollBottom = () => {
    var items = document.querySelectorAll(".div_messages_result");
    var last = items[0];

    if(!isLoading){
        if(divcontentRef){
            if(autoScroll){
                // var divheight = divcontentRef.current.scrollHeight
                // divcontentRef.current.scrollTop = divheight
                if(last){
                    last.scrollIntoView({
                        behavior: "instant",
                        block: "end"
                    });
                }
            }
        }
    }
  }

  useEffect(() => {
    var currentView = false;
    if(divcontentRef){
        if(divcontentRef.current){
            divcontentRef.current.onscroll = () => {
                if(divlazyloaderRef && divlazyloaderRef.current){
                    const top = divlazyloaderRef.current.getBoundingClientRect().top;
                    const isVisible = top > 0 ? true : false;
                    if(currentView != isVisible){
                        currentView = isVisible;
                        if(currentView){
                            setrange((prev) => prev + 10);
                        }
                    }
                }
            }
        }
    }

    scrollBottom()
  },[autoScroll, conversationsetup, messageslist, divcontentRef, divlazyloaderRef, isLoading, conversationList, pendingmessageslist])

  const addPendingMessage = (pendingLoad: any) => {
    dispatch({
        type: SET_PENDING_MESSAGES_LIST,
        payload: {
            pendingmessageslist: [
                ...pendingmessageslist,
                pendingLoad
            ]
        }
    })
  }

  const addMultiplePendingMessage = (pendingArrayLoad: any) => {
    dispatch({
        type: SET_PENDING_MESSAGES_LIST,
        payload: {
            pendingmessageslist: [
                ...pendingmessageslist,
                ...pendingArrayLoad
            ]
        }
    })
  }

  const sendMessageProcess = () => {
    var pendingID = `${authentication.user.userID}_${conversationsetup.conversationid}_${pendingmessageslist.length + 1}_${makeid(10)}`;
    if(checkIfValid([messageValue])){
        if(conversationsetup.type == "single"){
            addPendingMessage({
                conversationID: conversationsetup.conversationid,
                pendingID: pendingID,
                content: messageValue,
                type: "text"
            })
            SendMessageRequest({
                conversationID: conversationsetup.conversationid,
                pendingID: pendingID,
                receivers: [conversationsetup.userdetails.userID, authentication.user.userID],
                content: messageValue,
                isReply: isReplying.isReply,
                replyingTo: isReplying.replyingTo,
                messageType: "text",
                conversationType: "single"
            });
        }
        else{
            addPendingMessage({
                conversationID: conversationsetup.conversationid,
                pendingID: pendingID,
                content: messageValue,
                type: "text"
            })
            SendMessageRequest({
                conversationID: conversationsetup.conversationid,
                pendingID: pendingID,
                receivers: conversationsetup.groupdetails.receivers,
                content: messageValue,
                isReply: isReplying.isReply,
                replyingTo: isReplying.replyingTo,
                messageType: "text",
                conversationType: "group"
            });
        }
    }

    if(imgList.length > 0 || nonImgList.length > 0){
        var pendingArrImages = [...imgList, ...nonImgList].map((mp: any, i: number) => ({
            conversationID: conversationsetup.conversationid,
            pendingID: `${pendingID}_${i}`,
            content: mp.base,
            type: mp.type,
            name: mp.name
        }))

        // console.log(pendingArrImages)

        // var pendingArrImagesRaw = rawFilesList.map((mp, i) => ({
        //     conversationID: conversationsetup.conversationid,
        //     pendingID: `${pendingID}_${i}`,
        //     content: mp.base,
        //     type: "image"
        // }))

        // var mappedRawFiles = rawFilesList.map((mp) => mp.base)

        if(conversationsetup.type == "single"){
            addMultiplePendingMessage(pendingArrImages)
            SendFilesRequest({
                conversationID: conversationsetup.conversationid,
                receivers: [conversationsetup.userdetails.userID, authentication.user.userID],
                files: pendingArrImages,
                isReply: isReplying.isReply,
                replyingTo: isReplying.replyingTo,
                conversationType: "single"
            });
        }
        else{
            addMultiplePendingMessage(pendingArrImages)
            SendFilesRequest({
                conversationID: conversationsetup.conversationid,
                receivers: conversationsetup.groupdetails.receivers,
                files: pendingArrImages,
                isReply: isReplying.isReply,
                replyingTo: isReplying.replyingTo,
                conversationType: "group"
            });
        }
        setimgList([]);
        setnonImgList([]);
        setrawFilesList([]);
        setnonImageRawFilesList([]);
    }

    setmessageValue("")
    setisReplying({
        isReply: false,
        replyingTo: ""
    })
  }

  useEffect(() => {
    setisLoading(true);
    setconversationList([]);
    setrange(20);
    dispatch({
        type: SET_PENDING_MESSAGES_LIST,
        payload: {
            pendingmessageslist: []
        }
    })
  },[conversationsetup])

  console.log(pendingmessageslist)

  useEffect(() => {
    setrange((prev) => prev + 1);
  },[messageslist]) //conversationsetup

  useEffect(() => {
    SeenMessageRequest({
        conversationID: conversationsetup.conversationid,
        range: range,
        receivers: conversationsetup.type == "single"? [
            authentication.user.userID,
            conversationsetup.userdetails.userID
        ] : conversationsetup.groupdetails.receivers
    })
  },[range, conversationsetup])

  useEffect(() => {
    InitConversationRequest({
        conversationID: conversationsetup.conversationid,
        range: range,
        receivers: conversationsetup.type == "single"? [
            conversationsetup.userdetails.userID
        ] : conversationsetup.groupdetails.receivers
    }, setconversationList, settotalMessages, setisLoading, scrollBottom)
  },[range, conversationsetup])

  const sendImageProcess = () => {
    importData((arr: any) => {
        setimgList((prev: any) => [
            ...prev,
            {
                id: prev.length + 1,
                name: null,
                base: arr.data,
                type: "image"
            }
        ])
    }, (rawFiles: any) => {
        setrawFilesList((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                name: null,
                base: rawFiles.data,
                type: "image"
            }
        ])
    })
  }

  const removeSelectedPreview = (prevID: any) => {
    var mutatedPrevArr = imgList.filter((flt) => flt.id != prevID);
    var mutatedPrevRaw = rawFilesList.filter((flt) => flt.id != prevID);
    setimgList(mutatedPrevArr)
    setrawFilesList(mutatedPrevRaw)
  }

  const removeSelectedPreviewNonImg = (prevID: any) => {
    var mutatedPrevArr = nonImgList.filter((flt) => flt.id != prevID);
    var mutatedPrevRaw = nonImageRawFilesList.filter((flt) => flt.id != prevID);
    setnonImgList(mutatedPrevArr)
    setnonImageRawFilesList(mutatedPrevRaw)
  }

  const initMediaDevices = (callType: any) => {
    if(mediatrackholder.length > 0) {
        triggerCall(callType);
    }
    else{
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          }).then((value) => {
              dispatch({
                  type: MEDIA_MY_VIDEO_HOLDER,
                  payload: {
                      mediamyvideoholder: value
                 }
              })
              dispatch({
                  type: MEDIA_TRACK_HOLDER,
                  payload: {
                      mediatrackholder: value.getTracks()
                  }
              })
              triggerCall(callType);
          }).catch((err) => {
              console.log(err)
        })
    }
  }

  const triggerCall = (callType: any) => {
    const checkIfOnCall = callslist.filter((onc: any) => onc.conversationID == conversationsetup.conversationid);
    const checkIfOnPending = pendingcallalerts.filter((fltcall: any) => fltcall.callID == conversationsetup.conversationid);

    if(checkIfOnCall.length == 0 && checkIfOnPending.length == 0){
        CallRequest({
            callType: callType,
            callDisplayName: conversationsetup.type == "single"? `${authentication.user.fullName.firstName}` : `${conversationsetup.groupdetails.groupName} (Group)`,
            conversationType: conversationsetup.type,
            conversationID: conversationsetup.conversationid,
            caller: {
                name: authentication.user.fullName.firstName,
                userID: authentication.user.userID
            },
            recepients: conversationsetup.type == "single"? [conversationsetup.userdetails.userID] : conversationsetup.groupdetails.receivers.filter((flt: any) => flt != authentication.user.userID),
            displayImage: conversationsetup.type == "single"? conversationsetup.userdetails.profile : "none"
        }).then(() => {
            dispatch({
                type: REMOVE_REJECTED_CALL_LIST,
                payload: {
                  callID: conversationsetup.conversationid
                }
            })
            dispatch({
                type: SET_CALLS_LIST,
                payload: {
                    callslist: [
                        ...callslist,
                        {
                            callType: callType,
                            callDisplayName: conversationsetup.type == "single"? `${conversationsetup.userdetails.fullname.firstName}` : `${conversationsetup.groupdetails.groupName} (Group)`,
                            conversationType: conversationsetup.type,
                            conversationID: conversationsetup.conversationid,
                            caller: {
                                name: authentication.user.fullName.firstName,
                                userID: authentication.user.userID
                            },
                            recepients: conversationsetup.type == "single"? [conversationsetup.userdetails.userID, authentication.user.userID] : conversationsetup.groupdetails.receivers
                        }
                    ]
                }
            })
        }).catch((err) => {
            console.log(err)
        })
    }
  }

  const sendNonImageFilesProcess = () => {
    importNonImageData((arr: any) => {
        if(arr){
            if(arr.type.includes("image")){
                setimgList((prev: any) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        name: null,
                        base: arr.data,
                        type: "image"
                    }
                ])
            }
            else{
                setnonImgList((prev: any) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        base: arr.data,
                        type: arr.type,
                        name: arr.name
                    }
                ])
            }
        }
        else{
            dispatch({ type: SET_MUTATE_ALERTS, payload:{
                alerts: {
                    type: "warning",
                    content: "Cannot upload files greater than 25mb"
                }
            }})
        }
    }, (rawFiles: any) => {
        if(rawFiles){
            if(rawFiles.type.includes("image")){
                setrawFilesList((prev) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        name: null,
                        base: rawFiles.data,
                        type: "image"
                    }
                ])
            }
            else{
                // console.log(rawFiles)
                setnonImageRawFilesList((prev: any) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        base: rawFiles.data,
                        type: rawFiles.type,
                        name: rawFiles.name
                    }
                ])   
            }
        }
    })
  }

  const messageTypeChecker: any = {
    video: "a video",
    audio: "an audio",
    image: "a photo",
    any: "a file"
  }

  return (
    <motion.div
    animate={{
        display: pathnamelistener.includes("messages")? "flex" : screensizelistener.W <= 900? "none" : "flex",
        maxWidth: pathnamelistener.includes("messages")? "100%" : screensizelistener.W <= 900? "350px" : "350px",
        paddingTop: pathnamelistener.includes("messages")? "10px" : screensizelistener.W <= 900? "20px" : "20px"
    }}
    id='div_conversation'>
        <motion.div
        initial={{
            paddingRight: pathnamelistener.includes("messages")? "0px" : screensizelistener.W <= 900? "20px" : "20px",
            paddingBottom: pathnamelistener.includes("messages")? "0px" : screensizelistener.W <= 900? "10px" : "10px",
            width: pathnamelistener.includes("messages")? "calc(100% - 0px)" : screensizelistener.W <= 900? "calc(100% - 20px)" : "calc(100% - 20px)",
            height: pathnamelistener.includes("messages")? "calc(100% - 0px)" : screensizelistener.W <= 900? "calc(100% - 10px)" : "calc(100% - 10px)"
        }} 
        animate={{
            paddingRight: pathnamelistener.includes("messages")? "0px" : screensizelistener.W <= 900? "20px" : "20px",
            paddingBottom: pathnamelistener.includes("messages")? "0px" : screensizelistener.W <= 900? "10px" : "10px",
            width: pathnamelistener.includes("messages")? "calc(100% - 0px)" : screensizelistener.W <= 900? "calc(100% - 20px)" : "calc(100% - 20px)",
            height: pathnamelistener.includes("messages")? "calc(100% - 0px)" : screensizelistener.W <= 900? "calc(100% - 10px)" : "calc(100% - 10px)"
        }} 
        id='div_conversation_container'>
           <motion.div
           initial={{
                height: "0px",
                paddingBottom: "0px",
                paddingTop: "0px",
                borderRadius: pathnamelistener.includes("messages")? "0px" : screensizelistener.W <= 900? "10px" : "10px"
           }}
           animate={{
                height: "calc(100% - 10px)",
                paddingBottom: "5px",
                paddingTop: "5px",
                borderRadius: pathnamelistener.includes("messages")? "0px" : screensizelistener.W <= 900? "10px" : "10px"
           }}
           id='div_conversation_content_handler'>
                <div id='div_conversation_header'>
                    <div id='div_conversation_user'>
                        <div id='div_img_cncts_container'>
                          <div id='div_img_search_profiles_container_cncts'>
                            {conversationsetup.type == "single"? (
                                <img src={conversationsetup.userdetails.profile == "none"? DefaultProfile : conversationsetup.userdetails.profile} className='img_search_profiles_ntfs' />
                            ) : (
                                <img src={GroupChatIcon} className='img_gc_profiles_ntfs' />
                            )}
                          </div>
                          {isUserOnline(activeuserslist, conversationsetup.userdetails.userID) && (
                             <div className='div_online_indicator' />
                          )}
                        </div>
                        <div id='div_conversation_user_name'>
                            {conversationsetup.type == "single"? (
                                <span className='span_userdetails_name tw-cursor-pointer tw-border-b tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]'
                                onClick={() => {
                                  navigate(`/${conversationsetup.userdetails.userID}`)
                                }}
                              >{conversationsetup.userdetails.fullname.firstName}{conversationsetup.userdetails.fullname.middleName == "N/A"? "" : ` ${conversationsetup.userdetails.fullname.middleName}`} {conversationsetup.userdetails.fullname.lastName}</span>
                            ) : (
                                <span className='span_userdetails_name'>{conversationsetup.groupdetails.groupName}</span>
                            )}
                            {conversationsetup.type == "single"? (
                                activeusersmapper.includes(conversationsetup.userdetails.userID)? (
                                    activeuserSpecific[0].sessiondate? (
                                        activeuserSpecific[0].sessionStatus? (
                                            <span className='span_userdetails_name'>Active Now</span>
                                        ) : (
                                            <span className='span_userdetails_name'>
                                                {activeuserSpecific[0].sessiondate.time} {activeuserSpecific[0].sessiondate.date}
                                            </span>
                                        )
                                    ) : (
                                        <span className='span_userdetails_name'>Recently Active</span>
                                    )
                                ) : (
                                    <span className='span_userdetails_name'>Recently Active</span>
                                )
                            ) : (
                                <span className='span_userdetails_name'>Members are active</span>
                            )}
                        </div>
                    </div>
                    <div id='div_conversation_header_navigations'>
                        <motion.button
                        // disabled={true}
                        disabled={
                            pendingcallalerts.filter((fltcall: any) => fltcall.callID == conversationsetup.conversationid).length > 0?
                            true : false
                        }
                        whileHover={{
                            backgroundColor: "#e6e6e6"
                        }}
                        onClick={() => {
                            initMediaDevices("audio")
                        }}
                        className='btn_conversation_header_navigation'><BiSolidPhoneCall style={{fontSize: "25px", color: "#4994ec"}} /></motion.button>
                        <motion.button
                        // disabled={true}
                        disabled={
                            pendingcallalerts.filter((fltcall: any) => fltcall.callID == conversationsetup.conversationid).length > 0?
                            true : false
                        }
                        whileHover={{
                            backgroundColor: "#e6e6e6"
                        }}
                        onClick={() => {
                            initMediaDevices("video")
                        }}
                        className='btn_conversation_header_navigation'><FcVideoCall style={{fontSize: "25px"}} /></motion.button>
                        <motion.button
                        whileHover={{
                            backgroundColor: "#e6e6e6"
                        }}
                        className='btn_conversation_header_navigation'><FcInfo style={{fontSize: "25px"}} /></motion.button>
                    </div>
                </div>
                {isLoading? (
                    <div id='div_conversation_content_loader'>
                        <motion.div
                        animate={{
                        rotate: -360
                        }}
                        transition={{
                        duration: 1,
                        repeat: Infinity
                        }}
                        id='div_loader_request_conv'>
                            <AiOutlineLoading3Quarters style={{fontSize: "25px"}} />
                        </motion.div>
                    </div>
                ) : (
                    <div id='div_conversation_content' ref={divcontentRef} onScroll={(e) => {
                        if((e.currentTarget.scrollHeight - e.currentTarget.offsetHeight) - 100 > e.currentTarget.scrollTop){
                            setautoScroll(false)
                        }
                        else{
                            setautoScroll(true)
                        }
                    }}>
                        
                        {pendingmessageslist.reverse().filter((flt: any) => 
                            flt.conversationID == conversationsetup.conversationid 
                            && !flt.status 
                            && !conversationList.map((mp) => mp.pendingID).includes(flt.pendingID)
                        ).map((cnvs: any, i: number) => {
                            if(cnvs.type == "text"){
                                return(
                                    <motion.div
                                    key={i}
                                    className='div_messages_result tw-items-center'>
                                        <motion.div
                                        initial={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        animate={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
                                            <motion.span
                                            initial={{
                                                backgroundColor: "#82b7f6",
                                                border: "solid 1px #82b7f6",
                                                color: "white",
                                                // marginLeft: "auto" : "0px"
                                            }}
                                            animate={{
                                                backgroundColor: "#82b7f6",
                                                border: "solid 1px #82b7f6",
                                                color: "white",
                                                // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                                            }}
                                            className='span_messages_result c1'>{cnvs.content}</motion.span>
                                            <span className='span_sending_label'>...Sending</span>
                                        </motion.div>
                                    </motion.div>
                                )
                            }
                            else if(cnvs.type == "image"){
                                return(
                                    <motion.div
                                    key={i}
                                    className='div_messages_result tw-items-center'>
                                        <motion.div
                                        initial={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        animate={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
                                            <div className='div_pending_content_container_sending'>
                                                <img src={cnvs.content} className='img_pending_images' onLoad={() => {
                                                    scrollBottom()
                                                }} />
                                            </div>
                                            <span className='span_sending_label'>...Sending</span>
                                        </motion.div>
                                    </motion.div>
                                )
                            }
                            else if(cnvs.type.includes("video")){
                                return(
                                    <motion.div
                                    key={i}
                                    className='div_messages_result tw-items-center'>
                                        <motion.div
                                        initial={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        animate={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
                                            <div className='div_pending_content_container_sending'>
                                                <video src={cnvs.content} controls className='tw-w-full tw-h-[300px] tw-border-[7px]' onLoad={() => {
                                                    scrollBottom()
                                                }} />
                                            </div>
                                            <span className='span_sending_label'>...Sending</span>
                                        </motion.div>
                                    </motion.div>
                                )
                            }
                            else if(cnvs.type.includes("audio")){
                                return(
                                    <motion.div
                                    key={i}
                                    className='div_messages_result tw-items-center'>
                                        <motion.div
                                        initial={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        animate={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        className='tw-flex tw-flex-col tw-w-full tw-max-w-[70%]'>
                                            <div className='div_pending_audio_content_container_sending'>
                                                <audio src={cnvs.content} controls className='tw-w-full tw-border-[7px]' onLoad={() => {
                                                    scrollBottom()
                                                }} />
                                            </div>
                                            <span className='span_sending_label'>...Sending</span>
                                        </motion.div>
                                    </motion.div>
                                )
                            }
                            else{
                                return(
                                    <motion.div
                                    key={i}
                                    className='div_messages_result tw-items-center'>
                                        <motion.div
                                        initial={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        animate={{
                                            marginLeft: "auto",
                                            alignItems: "flex-end"
                                        }}
                                        className='tw-flex tw-flex-col tw-w-full tw-max-w-[70%]'>
                                            <div className='tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]'>
                                                <div className='tw-w-full tw-max-w-[40px]'>
                                                    <IoDocumentOutline style={{ fontSize: "40px" }} />
                                                </div>
                                                <span className='tw-text-[12px] tw-break-all ellipsis-3-lines tw-font-semibold'>{cnvs.name}</span>
                                            </div>
                                            <span className='span_sending_label'>...Sending</span>
                                        </motion.div>
                                    </motion.div>
                                )
                            }
                        })}
                        {conversationList.map((cnvs, i) => {
                            return(
                                <ContentHandler 
                                    key={cnvs.messageID} 
                                    i={i} 
                                    cnvs={cnvs} 
                                    conversationsetup={conversationsetup}
                                    setisReplying={setisReplying} 
                                    setfullImageScreen={setfullImageScreen} 
                                    scrollBottom={scrollBottom} 
                                />
                            )
                        })}
                        {conversationList.length > 0 && totalMessages > range && (
                            <div ref={divlazyloaderRef} id='divlazyloader' className='tw-flex tw-items-center tw-justify-center tw--mt-[15px] tw-mb-[5px]'>
                                <div className='tw-h-[50px] tw-flex tw-items-center tw-justify-center'>
                                    <motion.div
                                        animate={{
                                            rotate: -360
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity
                                        }}
                                    id='div_loader_request_conv'>
                                        <AiOutlineLoading3Quarters style={{fontSize: "20px"}} />
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {fullImageScreen.toggle && (
                    <div id='div_fullscreen_image_preview'>
                        <button id='btn_close_fip' onClick={() => {
                            setfullImageScreen({
                                preview: "",
                                toggle: false
                            })
                        }} >
                            <AiOutlineClose style={{
                                fontSize: "17px"
                            }} />
                        </button>
                        <div id='div_fip_onblur' onClick={() => {
                            setfullImageScreen({
                                preview: "",
                                toggle: false
                            })
                        }} />
                        <img src={fullImageScreen.preview} id='img_fip' />
                    </div>
                )}
                <motion.div
                initial={{
                    height: "0px",
                    paddingTop: "0px",
                    paddingBottom: "0px",
                    backgroundColor: "white",
                    color: "white",
                    borderRadius: "10px"
                }}
                animate={{
                    height: isReplying.isReply? "auto" : "0px",
                    paddingTop: isReplying.isReply? "10px" : "0px",
                    paddingBottom: isReplying.isReply? "10px" : "0px",
                    borderRadius: "10px",
                    backgroundColor: isReplying.isReply? conversationList.filter((flt: any) => flt.messageID == isReplying.replyingTo)[0].sender === authentication.user.userID? "#1c7def" : "#dedede" : "white",
                    color: isReplying.isReply? conversationList.filter((flt: any) => flt.messageID == isReplying.replyingTo)[0].sender === authentication.user.userID? "white" : "black" : "white"
                }}
                id='div_selected_images_container'
                className='theme_scroller'>
                    <div className='tw-w-full tw-flex tw-flex-row'>
                        <div className='tw-flex tw-flex-1 tw-flex-col tw-items-start tw-gap-[2px] ellipsis-3-lines'>
                            <span className='tw-text-[12px] tw-font-semibold tw-font-inter ellipsis-1-line'>
                                {isReplying.isReply && (
                                    conversationList.filter((flt: any) => flt.messageID == isReplying.replyingTo)[0].sender === authentication.user.userID?
                                    "Replying to your message" : `Replying to @${conversationList.filter((flt: any) => flt.messageID == isReplying.replyingTo)[0].sender}`
                                )}
                            </span>
                            <span className='tw-text-[12px] tw-font-inter tw-w-full tw-text-left ellipsis-3-lines'>
                                {isReplying.isReply && (
                                    conversationList.filter((flt: any) => flt.messageID == isReplying.replyingTo)[0].messageType === "text"?
                                    conversationList.filter((flt: any) => flt.messageID == isReplying.replyingTo)[0].content : 
                                    `${messageTypeChecker[conversationList.filter((flt: any) => flt.messageID == isReplying.replyingTo)[0].messageType.split("/")[0]] || 'a file'}`
                                )}
                            </span>
                        </div>
                        <button onClick={() => { setisReplying({ isReply: false, replyingTo: "" }) }} className='btn_remove_preview'>
                            <AiOutlineClose />
                        </button>
                    </div>
                </motion.div>
                <motion.div
                initial={{
                    height: "0px",
                    paddingTop: "0px",
                    paddingBottom: "0px"
                }}
                animate={{
                    height: imgList.length || nonImgList.length > 0? "auto" : "0px",
                    paddingTop: imgList.length || nonImgList.length > 0? "10px" : "0px",
                    paddingBottom: imgList.length || nonImgList.length > 0? "10px" : "0px"
                }}
                id='div_selected_images_container'
                className='theme_scroller'>
                    {nonImgList.map((nonimgl: any, i: number) => {
                        if(nonimgl.type.includes("video")){
                            return(
                                <div key={`nonimg_${i}`} className='div_img_selected_preview'>
                                    <div className='div_btn_remove_container'>
                                        <button onClick={() => { removeSelectedPreviewNonImg(nonimgl.id) }} className='btn_remove_preview'>
                                            <AiOutlineClose />
                                        </button>
                                    </div>
                                    <video src={nonimgl.base} className='img_selected_preview' onClick={() => { removeSelectedPreviewNonImg(nonimgl.id) }} />
                                </div>
                            )
                        }
                        else if(nonimgl.type.includes("audio")){
                            return(
                                <div title={nonimgl.name} key={`nonimg_${i}`} className='div_img_selected_preview_non_img'>
                                    <div className='div_btn_remove_container'>
                                        <button onClick={() => { removeSelectedPreviewNonImg(nonimgl.id) }} className='btn_remove_preview'>
                                            <AiOutlineClose />
                                        </button>
                                    </div>
                                    <div className='img_selected_preview tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[7px]'>
                                        <MdAudiotrack style={{ fontSize: "40px" }} />
                                        <span className='tw-w-[calc(100%-20px)] tw-text-[10px] tw-truncate'>{nonimgl.name}</span>
                                    </div>
                                </div>
                            )
                        }
                        else{
                            return(
                                <div title={nonimgl.name} key={`nonimg_${i}`} className='div_img_selected_preview_non_img'>
                                    <div className='div_btn_remove_container'>
                                        <button onClick={() => { removeSelectedPreviewNonImg(nonimgl.id) }} className='btn_remove_preview'>
                                            <AiOutlineClose />
                                        </button>
                                    </div>
                                    <div className='img_selected_preview tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[7px]'>
                                        <IoDocumentOutline style={{ fontSize: "40px" }} />
                                        <span className='tw-w-[calc(100%-20px)] tw-text-[10px] tw-truncate'>{nonimgl.name}</span>
                                    </div>
                                </div>
                            )
                        }
                    })}
                    {imgList.map((imgl, i) => {
                        return(
                            <div key={i} className='div_img_selected_preview'>
                                <div className='div_btn_remove_container'>
                                    <button onClick={() => { removeSelectedPreview(imgl.id) }} className='btn_remove_preview'>
                                        <AiOutlineClose />
                                    </button>
                                </div>
                                <img src={imgl.base} className='img_selected_preview' />
                            </div>
                        )
                    })}
                </motion.div>
                <div id='div_send_controls'>
                    <div id='div_options_send'>
                        <motion.button
                        whileHover={{
                            backgroundColor: isLoading? "transparent" : "#e6e6e6",
                            cursor: isLoading? "default" : "pointer"
                        }}
                        disabled={isLoading}
                        onClick={() => {
                            sendNonImageFilesProcess()
                        }}
                        className='btn_options_send'><RiAddCircleFill style={{fontSize: "25px", color: "#90caf9"}} /></motion.button>
                        <motion.button
                        whileHover={{
                            backgroundColor: isLoading? "transparent" : "#e6e6e6",
                            cursor: isLoading? "default" : "pointer"
                        }}
                        disabled={isLoading}
                        onClick={() => {
                            sendImageProcess()
                        }}
                        className='btn_options_send'><FcAddImage style={{fontSize: "25px"}} /></motion.button>
                    </div>
                    <div id='div_input_text_content'>
                        <input type='text' autoComplete="off" id='input_text_content_send'
                        onKeyDown={(e) => {
                            if(e.code == "Enter"){
                                sendMessageProcess()
                            }
                        }}
                        disabled={isLoading} placeholder='Write a message....'value={messageValue} onChange={(e) => {
                            setmessageValue(e.target.value)
                        }} />
                    </div>
                    <div id='div_confirm_send'>
                        <motion.button
                        whileHover={{
                            backgroundColor: isLoading? "transparent" : "#e6e6e6",
                            cursor: isLoading? "default" : "pointer"
                        }}
                        onClick={() => {
                            sendMessageProcess()
                        }}
                        disabled={isLoading}
                        className='btn_options_send'><IoSend style={{fontSize: "25px", color: "#1c7DEF"}} /></motion.button>
                    </div>
                </div>
           </motion.div>
        </motion.div>
    </motion.div>
  )
}

export default Conversation