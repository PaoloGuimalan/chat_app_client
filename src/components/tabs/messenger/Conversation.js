import React, { useState } from 'react'
import '../../../styles/tabs/messenger/index.css'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'
import { FcVideoCall, FcInfo, FcImageFile, FcAddImage, FcFile } from 'react-icons/fc'
import { BiSolidPhoneCall } from 'react-icons/bi'
import { RiAddCircleFill } from 'react-icons/ri'
import { IoSend } from 'react-icons/io5'
import { checkIfValid } from '../../../reusables/hooks/validatevariables'
import { SendMessageRequest } from '../../../reusables/hooks/requests'
import { useDispatch, useSelector } from 'react-redux'

function Conversation({ conversationsetup }) {

  const authentication = useSelector(state => state.authentication)
  const [messageValue, setmessageValue] = useState("");
  const [isReplying, setisReplying] = useState({
    isReply: false
  })  
  const dispatch = useDispatch()

  const sendMessageProcess = () => {
    if(checkIfValid([messageValue])){
        SendMessageRequest({
            conversationID: conversationsetup.conversationID,
            receivers: [conversationsetup.userdetails.userID, authentication.user.userID],
            content: messageValue,
            isReply: isReplying.isReply,
            messageType: "text",
            conversationType: "single"
        },dispatch, setmessageValue)
    }
  }

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
                <div id='div_conversation_content'>
                    {/* Messages Area */}
                </div>
                <div id='div_send_controls'>
                    <div id='div_options_send'>
                        <motion.button
                        whileHover={{
                            backgroundColor: "#e6e6e6"
                        }}className='btn_options_send'><RiAddCircleFill style={{fontSize: "25px", color: "#90caf9"}} /></motion.button>
                        <motion.button
                        whileHover={{
                            backgroundColor: "#e6e6e6"
                        }}className='btn_options_send'><FcAddImage style={{fontSize: "25px"}} /></motion.button>
                    </div>
                    <div id='div_input_text_content'>
                        <input type='text' id='input_text_content_send' placeholder='Write a message....'value={messageValue} onChange={(e) => {
                            setmessageValue(e.target.value)
                        }} />
                    </div>
                    <div id='div_confirm_send'>
                        <motion.button
                        whileHover={{
                            backgroundColor: "#e6e6e6"
                        }}
                        onClick={() => {
                            sendMessageProcess()
                        }}
                        className='btn_options_send'><IoSend style={{fontSize: "25px", color: "#1c7DEF"}} /></motion.button>
                    </div>
                </div>
           </motion.div>
        </div>
    </div>
  )
}

export default Conversation