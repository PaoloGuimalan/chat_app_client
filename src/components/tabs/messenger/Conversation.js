import React, { useEffect, useRef, useState } from 'react'
import '../../../styles/tabs/messenger/index.css'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'
import GroupChatIcon from '../../../assets/imgs/group-chat-icon.jpg'
import { FcVideoCall, FcInfo, FcImageFile, FcAddImage, FcFile } from 'react-icons/fc'
import { BiSolidPhoneCall } from 'react-icons/bi'
import { RiAddCircleFill } from 'react-icons/ri'
import { IoSend } from 'react-icons/io5'
import { checkIfValid } from '../../../reusables/hooks/validatevariables'
import { InitConversationRequest, SeenMessageRequest, SendMessageRequest } from '../../../reusables/hooks/requests'
import { useDispatch, useSelector } from 'react-redux'
import { AiOutlineBell, AiOutlineLoading3Quarters } from 'react-icons/ai'

function Conversation({ conversationsetup }) {

  const authentication = useSelector(state => state.authentication)
  const messageslist = useSelector(state => state.messageslist)
  const screensizelistener = useSelector(state => state.screensizelistener);
  const pathnamelistener = useSelector(state => state.pathnamelistener)
  const [messageValue, setmessageValue] = useState("");
  const [conversationList, setconversationList] = useState([])
  const [isLoading, setisLoading] = useState(true);
  const [autoScroll, setautoScroll] = useState(true)
  const [isReplying, setisReplying] = useState({
    isReply: false
  })  
  const dispatch = useDispatch()

  const divcontentRef = useRef(null)

//   useEffect(() => {
//     if(!isLoading){
//         if(divcontentRef){
//             console.log(divcontentRef.current.clientHeight, divcontentRef.current.scrollHeight)
//         }
//     }
//   },[conversationsetup, messageslist, divcontentRef, isLoading])

  const scrollBottom = () => {
    var items = document.querySelectorAll(".span_messages_result");
    var last = items[items.length-1];

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
    scrollBottom()
  },[autoScroll, conversationsetup, messageslist, divcontentRef, isLoading, conversationList])

  const sendMessageProcess = () => {
    if(checkIfValid([messageValue])){
        if(conversationsetup.type == "single"){
            SendMessageRequest({
                conversationID: conversationsetup.conversationid,
                receivers: [conversationsetup.userdetails.userID, authentication.user.userID],
                content: messageValue,
                isReply: isReplying.isReply,
                messageType: "text",
                conversationType: "single"
            }, dispatch, setmessageValue)
        }
        else{
            SendMessageRequest({
                conversationID: conversationsetup.conversationid,
                receivers: conversationsetup.groupdetails.receivers,
                content: messageValue,
                isReply: isReplying.isReply,
                messageType: "text",
                conversationType: "group"
            }, dispatch, setmessageValue)
        }
    }
    setmessageValue("")
  }

  useEffect(() => {
    setisLoading(true)
    setconversationList([])
  },[conversationsetup])

  useEffect(() => {
    SeenMessageRequest({
        conversationID: conversationsetup.conversationid,
        receivers: conversationsetup.type == "single"? [
            authentication.user.userID,
            conversationsetup.userdetails.userID
        ] : conversationsetup.groupdetails.receivers
    })
  },[conversationsetup])

  useEffect(() => {
    InitConversationRequest({
        conversationID: conversationsetup.conversationid,
        receivers: conversationsetup.type == "single"? [
            conversationsetup.userdetails.userID
        ] : conversationsetup.groupdetails.receivers
    }, setconversationList, setisLoading, scrollBottom)
  },[conversationsetup, messageslist])

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
                        </div>
                        <div id='div_conversation_user_name'>
                            {conversationsetup.type == "single"? (
                                <span className='span_userdetails_name'>{conversationsetup.userdetails.fullname.firstName}{conversationsetup.userdetails.fullname.middleName == "N/A"? "" : ` ${conversationsetup.userdetails.fullname.middleName}`} {conversationsetup.userdetails.fullname.lastName}</span>
                            ) : (
                                <span className='span_userdetails_name'>{conversationsetup.groupdetails.groupName}</span>
                            )}
                            {conversationsetup.type == "single"? (
                                <span className='span_userdetails_name'>Recently Active</span>
                            ) : (
                                <span className='span_userdetails_name'>Members are active</span>
                            )}
                        </div>
                    </div>
                    <div id='div_conversation_header_navigations'>
                        <motion.button
                        whileHover={{
                            backgroundColor: "#e6e6e6"
                        }}
                        className='btn_conversation_header_navigation'><BiSolidPhoneCall style={{fontSize: "25px", color: "#4994ec"}} /></motion.button>
                        <motion.button
                        whileHover={{
                            backgroundColor: "#e6e6e6"
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
                        {conversationList.map((cnvs, i) => {
                            if(cnvs.messageType == "text"){
                                return(
                                    <motion.div
                                    key={i} 
                                    initial={{
                                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                                    }}
                                    animate={{
                                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                                    }}
                                    className='div_messages_result'>
                                        {conversationsetup.type == "group" && (<span className='span_sender_label'>{cnvs.sender}</span>)}
                                        <motion.span
                                        title={`${cnvs.messageDate.date} ${cnvs.messageDate.time}`}
                                        initial={{
                                            backgroundColor: cnvs.sender == authentication.user.userID? "#1c7DEF" : "rgb(222, 222, 222)",
                                            border: cnvs.sender == authentication.user.userID? "solid 1px #1c7DEF" : "solid 1px rgb(222, 222, 222)",
                                            color: cnvs.sender == authentication.user.userID? "white" : "#3b3b3b",
                                            // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                                        }}
                                        animate={{
                                            backgroundColor: cnvs.sender == authentication.user.userID? "#1c7DEF" : "rgb(222, 222, 222)",
                                            border: cnvs.sender == authentication.user.userID? "solid 1px #1c7DEF" : "solid 1px rgb(222, 222, 222)",
                                            color: cnvs.sender == authentication.user.userID? "white" : "#3b3b3b",
                                            // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                                        }}
                                        className='span_messages_result'>{cnvs.content}</motion.span>
                                    </motion.div>
                                )
                            }
                            else{
                                return(
                                    <span key={i} className='span_gc_notif_label'>{cnvs.content}</span>
                                )
                            }
                        })}
                    </div>
                )}
                <div id='div_send_controls'>
                    <div id='div_options_send'>
                        <motion.button
                        whileHover={{
                            backgroundColor: isLoading? "transparent" : "#e6e6e6",
                            cursor: isLoading? "default" : "pointer"
                        }}
                        disabled={isLoading}
                        className='btn_options_send'><RiAddCircleFill style={{fontSize: "25px", color: "#90caf9"}} /></motion.button>
                        <motion.button
                        whileHover={{
                            backgroundColor: isLoading? "transparent" : "#e6e6e6",
                            cursor: isLoading? "default" : "pointer"
                        }}
                        disabled={isLoading}
                        className='btn_options_send'><FcAddImage style={{fontSize: "25px"}} /></motion.button>
                    </div>
                    <div id='div_input_text_content'>
                        <input type='text' id='input_text_content_send'
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