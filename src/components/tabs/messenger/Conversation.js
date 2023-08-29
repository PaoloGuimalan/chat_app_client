import React, { useEffect, useState } from 'react'
import '../../../styles/tabs/messenger/index.css'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'
import { FcVideoCall, FcInfo, FcImageFile, FcAddImage, FcFile } from 'react-icons/fc'
import { BiSolidPhoneCall } from 'react-icons/bi'
import { RiAddCircleFill } from 'react-icons/ri'
import { IoSend } from 'react-icons/io5'
import { checkIfValid } from '../../../reusables/hooks/validatevariables'
import { InitConversationRequest, SendMessageRequest } from '../../../reusables/hooks/requests'
import { useDispatch, useSelector } from 'react-redux'
import { AiOutlineBell, AiOutlineLoading3Quarters } from 'react-icons/ai'

function Conversation({ conversationsetup }) {

  const authentication = useSelector(state => state.authentication)
  const messageslist = useSelector(state => state.messageslist)
  const [messageValue, setmessageValue] = useState("");
  const [conversationList, setconversationList] = useState([])
  const [isLoading, setisLoading] = useState(true);
  const [isReplying, setisReplying] = useState({
    isReply: false
  })  
  const dispatch = useDispatch()

  const sendMessageProcess = () => {
    if(checkIfValid([messageValue])){
        SendMessageRequest({
            conversationID: conversationsetup.conversationid,
            receivers: [conversationsetup.userdetails.userID, authentication.user.userID],
            content: messageValue,
            isReply: isReplying.isReply,
            messageType: "text",
            conversationType: "single"
        }, dispatch, setmessageValue)
    }
  }

  useEffect(() => {
    setconversationList([])
  },[conversationsetup])

  useEffect(() => {
    InitConversationRequest({
        conversationID: conversationsetup.conversationid
    }, setconversationList, setisLoading)
  },[conversationsetup, messageslist])

  return (
    <div id='div_conversation'>
        <div id='div_conversation_container'>
           <motion.div
           initial={{
                height: "0px",
                paddingBottom: "0px",
                paddingTop: "0px"
           }}
           animate={{
                height: "calc(100% - 10px)",
                paddingBottom: "5px",
                paddingTop: "5px"
           }}
           id='div_conversation_content_handler'>
                <div id='div_conversation_header'>
                    <div id='div_conversation_user'>
                        <div id='div_img_cncts_container'>
                          <div id='div_img_search_profiles_container_cncts'>
                            <img src={conversationsetup.userdetails.profile == "none"? DefaultProfile : conversationsetup.userdetails.profile} className='img_search_profiles_ntfs' />
                          </div>
                        </div>
                        <div id='div_conversation_user_name'>
                            <span className='span_userdetails_name'>{conversationsetup.userdetails.fullname.firstName}{conversationsetup.userdetails.fullname.middleName == "N/A"? "" : ` ${conversationsetup.userdetails.fullname.middleName}`} {conversationsetup.userdetails.fullname.lastName}</span>
                            <span className='span_userdetails_name'>Recently Active</span>
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
                        id='div_loader_request'>
                            <AiOutlineLoading3Quarters style={{fontSize: "25px"}} />
                        </motion.div>
                    </div>
                ) : (
                    <div id='div_conversation_content'>
                        {conversationList.map((cnvs, i) => {
                            return(
                                <motion.span
                                initial={{
                                    backgroundColor: cnvs.sender == authentication.user.userID? "#1c7DEF" : "rgb(222, 222, 222)",
                                    border: cnvs.sender == authentication.user.userID? "solid 1px #1c7DEF" : "solid 1px rgb(222, 222, 222)",
                                    marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                                    color: cnvs.sender == authentication.user.userID? "white" : "#3b3b3b"
                                }}
                                animate={{
                                    backgroundColor: cnvs.sender == authentication.user.userID? "#1c7DEF" : "rgb(222, 222, 222)",
                                    border: cnvs.sender == authentication.user.userID? "solid 1px #1c7DEF" : "solid 1px rgb(222, 222, 222)",
                                    marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                                    color: cnvs.sender == authentication.user.userID? "white" : "#3b3b3b"
                                }}
                                key={i} className='span_messages_result'>{cnvs.content}</motion.span>
                            )
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
                        <input type='text' id='input_text_content_send' disabled={isLoading} placeholder='Write a message....'value={messageValue} onChange={(e) => {
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
        </div>
    </div>
  )
}

export default Conversation