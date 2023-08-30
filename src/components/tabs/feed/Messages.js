import React, { useEffect, useState } from 'react'
import '../../../styles/tabs/feed/index.css'
import { AiOutlineMessage, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'
import Conversation from '../messenger/Conversation'
import { InitConversationListRequest } from '../../../reusables/hooks/requests'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'
import { SET_CONVERSATION_SETUP } from '../../../redux/types'

function Messages() {

  const [isLoading, setisLoading] = useState(true)

  const authentication = useSelector(state => state.authentication)
  const screensizelistener = useSelector(state => state.screensizelistener);
  const pathnamelistener = useSelector(state => state.pathnamelistener)
  const conversationsetup = useSelector(state => state.conversationsetup)
  const messageslist = useSelector(state => state.messageslist)
  const dispatch = useDispatch()

  useEffect(() => {
    InitConversationListRequest({}, dispatch, setisLoading)
  },[])

  const navigateToConversation = (conversationID, userdetails) => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload:{
        conversationsetup: {
          conversationid: conversationID,
          userdetails: userdetails
        }
      }
    })
  }

  return (
    conversationsetup.conversationid? (
      <Conversation conversationsetup={conversationsetup} />
    ) : (
      <motion.div
      animate={{
          display: pathnamelistener.includes("messages")? "flex" : screensizelistener.W <= 900? "none" : "flex"
      }} 
      id='div_messages_main'>
        <div id='div_messages_label_container'>
            <AiOutlineMessage style={{fontSize: "20px", color: "white", backgroundColor: "#9cc2ff", borderRadius: "7px", padding: "3px"}} />
            <span className='span_messages_label'>Messages</span>
        </div>
        {isLoading? (
        <div id='div_isLoading_notifications'>
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
          messageslist.length == 0? (
              <div id='div_messages_list_empty_container'>
                <span className='span_empty_list_label'>No Messages</span>
              </div>
            ) : (
              <div id='div_messages_list_container'>
                {messageslist.map((msgslst, i) => {
                  if(msgslst.conversationType == "single"){
                    return msgslst.users.map((msgsurs, i) => {
                      if(msgsurs.userID != authentication.user.userID){
                        return(
                          <motion.div
                          whileHover={{
                            backgroundColor: "rgb(200, 200, 200)"
                          }}
                          onClick={() => {
                            navigateToConversation(msgslst.conversationID, msgsurs)
                          }}
                          key={i} className='div_messages_list_cards'>
                            <div id='div_img_cncts_container'>
                              <div id='div_img_search_profiles_container_cncts'>
                                <img src={msgsurs.profile == "none"? DefaultProfile : msgsurs.profile} className='img_search_profiles_ntfs' />
                              </div>
                            </div>
                            <div id='div_messages_list_name'>
                              <span className='span_messages_list_name'>{msgsurs.fullname.firstName}{msgsurs.fullname.middleName == "N/A"? "" : ` ${msgsurs.fullname.middleName}`} {msgsurs.fullname.lastName}</span>
                              <span className='span_messages_list_name'>{msgslst.sender == authentication.user.userID? "you:": ""} {msgslst.content}</span>
                              <span className='span_messages_list_name'>{msgslst.messageDate.date} . {msgslst.messageDate.time}</span>
                            </div>
                          </motion.div>
                        )
                      }
                    })
                  }
                })}
              </div>
            )
        )}
      </motion.div>
    )
  )
}

export default Messages