import { useEffect, useState } from 'react'
import '../../../styles/styles.css'
import { AiOutlineMessage, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { TbServer2 } from 'react-icons/tb'
import { BiGroup } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'
import Conversation from '../messenger/Conversation'
import { InitConversationListRequest } from '../../../reusables/hooks/requests'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'
import GroupChatIcon from '../../../assets/imgs/group-chat-icon.jpg'
import { SET_CONVERSATION_SETUP } from '../../../redux/types'
import CreateGroupChatModal from '../../modals/CreateGroupChatModal'
import { conversationsetupstate } from '../../../redux/actions/states'
import { isUserOnline } from '../../../reusables/hooks/reusable'

function Messages() {

  const [isLoading, setisLoading] = useState(true)
  const [isCreateGCToggle, setisCreateGCToggle] = useState(false)

  const authentication = useSelector((state: any) => state.authentication)
  const activeuserslist = useSelector((state: any) => state.activeuserslist)
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener)
  const conversationsetup = useSelector((state: any) => state.conversationsetup)
  const messageslist = useSelector((state: any) => state.messageslist)
  const dispatch = useDispatch()

  useEffect(() => {
    InitConversationListRequest(dispatch, setisLoading)
  },[])

  const navigateToConversation = (type: any, conversationID: any, userdetails: any) => {
    if(type == "single"){
      dispatch({
        type: SET_CONVERSATION_SETUP,
        payload:{
          conversationsetup: {
            conversationid: conversationID,
            userdetails: userdetails,
            groupdetails: conversationsetupstate.groupdetails,
            type: "single"
          }
        }
      })
    }
    else{
      dispatch({
        type: SET_CONVERSATION_SETUP,
        payload:{
          conversationsetup: {
            conversationid: conversationID,
            userdetails: conversationsetupstate.userdetails,
            groupdetails: userdetails,
            type: "group"
          }
        }
      })
    }
  }

  const messageTypeChecker: any = {
    video: "a video",
    audio: "an audio",
    image: "an photo",
    any: "a file"
  }

  return (
    conversationsetup.conversationid? (
      <Conversation conversationsetup={conversationsetup} />
    ) : (
      <motion.div
      animate={{
          display: pathnamelistener.includes("messages")? "flex" : screensizelistener.W <= 900? "none" : "flex",
          maxWidth: pathnamelistener.includes("messages")? "600px" : screensizelistener.W <= 900? "350px" : "350px"
      }} 
      id='div_messages_main'>
        {isCreateGCToggle && (
          <CreateGroupChatModal setisCreateGCToggle={setisCreateGCToggle} />
        )}
        <div id='div_messages_label_container'>
            <AiOutlineMessage style={{fontSize: "20px", color: "white", backgroundColor: "#9cc2ff", borderRadius: "7px", padding: "3px"}} />
            <span className='span_messages_label'>Messages</span>
        </div>
        <div id='div_messages_options'>
          <motion.button id='btn_create_gc' onClick={() => { setisCreateGCToggle(true) }}>
            <BiGroup style={{ fontSize: "20px" }} />
            <span id='span_btn_label'>Create Group Chat</span>
          </motion.button>
          <motion.button id='btn_create_server' onClick={() => {  }}>
            <TbServer2 style={{ fontSize: "20px" }} />
            <span id='span_btn_label'>Create Server</span>
          </motion.button>
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
              <div id='div_messages_list_container' className='scroller'>
                {messageslist.map((msgslst: any, i: number) => {
                  if(msgslst.conversationType == "single"){
                    return msgslst.users.map((msgsurs: any, i: number) => {
                      if(msgsurs.userID != authentication.user.userID){
                        return(
                          <motion.div
                          whileHover={{
                            backgroundColor: "rgb(200, 200, 200)"
                          }}
                          onClick={() => {
                            navigateToConversation("single", msgslst.conversationID, msgsurs)
                          }}
                          key={i} className='div_messages_list_cards'>
                            <div id='div_img_cncts_container'>
                              <div id='div_img_search_profiles_container_cncts'>
                                <img src={msgsurs.profile == "none"? DefaultProfile : msgsurs.profile} className='img_search_profiles_ntfs' />
                              </div>
                              {isUserOnline(activeuserslist, msgsurs.userID) && (
                                <div className='div_online_indicator' />
                              )}
                            </div>
                            <div id='div_messages_list_name'>
                              <span className='span_messages_list_name'>{msgsurs.fullname.firstName}{msgsurs.fullname.middleName == "N/A"? "" : ` ${msgsurs.fullname.middleName}`} {msgsurs.fullname.lastName}</span>
                              <span className='span_messages_list_name'>{msgslst.sender == authentication.user.userID? "you: ": ""} 
                                {
                                  msgslst.messageType == "text"? msgslst.content : !msgslst.messageType.includes("image") && !msgslst.messageType.includes("video") && !msgslst.messageType.includes("audio") ? messageTypeChecker["any"] : `Sent ${messageTypeChecker[msgslst.messageType.split("/")[0]]}`
                                }
                              </span>
                              <span className='span_messages_list_name'>{msgslst.messageDate.date} . {msgslst.messageDate.time}</span>
                            </div>
                            {msgslst.unread > 0 && (
                              <div>
                                <span className='span_messages_list_counts'>{msgslst.unread}</span>
                              </div>
                            )}
                          </motion.div>
                        )
                      }
                    })
                  }
                  else if(msgslst.conversationType == "group"){
                    return(
                      <motion.div
                      whileHover={{
                        backgroundColor: "rgb(200, 200, 200)"
                      }}
                      onClick={() => {
                        navigateToConversation("group", msgslst.conversationID, {
                          ...msgslst.groupdetails,
                          receivers: msgslst.receivers
                        })
                      }}
                      key={i} className='div_messages_list_cards'>
                        <div id='div_img_cncts_container'>
                          <div id='div_img_search_profiles_container_cncts'>
                            <img src={GroupChatIcon} className='img_gc_profiles_ntfs' />
                          </div>
                        </div>
                        <div id='div_messages_list_name'>
                          <span className='span_messages_list_name'>{msgslst.groupdetails.groupName} (Group Chat)</span>
                          <span className='span_messages_list_name'>{msgslst.sender == authentication.user.userID? "you: ": ""}
                            {
                              msgslst.messageType == "text"? msgslst.content : !msgslst.messageType.includes("image") && !msgslst.messageType.includes("video") && !msgslst.messageType.includes("audio") ? messageTypeChecker["any"] : `Sent ${messageTypeChecker[msgslst.messageType.split("/")[0]]}`
                            }
                          </span>
                          <span className='span_messages_list_name'>{msgslst.messageDate.date} . {msgslst.messageDate.time}</span>
                        </div>
                        {msgslst.unread > 0 && (
                          <div>
                            <span className='span_messages_list_counts'>{msgslst.unread}</span>
                          </div>
                        )}
                      </motion.div>
                    )
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