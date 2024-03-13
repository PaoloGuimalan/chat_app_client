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
import ServerIcon from '../../../assets/imgs/servericon.png'
import { SET_CONVERSATION_SETUP } from '../../../redux/types'
import CreateGroupChatModal from '../../widgets/modals/CreateGroupChatModal'
import { conversationsetupstate } from '../../../redux/actions/states'
import { isUserOnline } from '../../../reusables/hooks/reusable'
import CreateServerModal from '@/app/widgets/modals/CreateServerModal'
import { useNavigate } from 'react-router-dom'

function Messages() {

  const [isLoading, setisLoading] = useState<boolean>(true);
  const [isCreateGCToggle, setisCreateGCToggle] = useState<boolean>(false);
  const [isCreateServerToggle, setisCreateServerToggle] = useState<boolean>(false);

  const authentication = useSelector((state: any) => state.authentication);
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const conversationsetup = useSelector((state: any) => state.conversationsetup);
  const messageslist = useSelector((state: any) => state.messageslist);
  const istypinglist = useSelector((state: any) => state.istypinglist);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    image: "a photo",
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
        {isCreateServerToggle && (
          <CreateServerModal setisCreateServerToggle={setisCreateServerToggle} />
        )}
        <div id='div_messages_label_container'>
            <AiOutlineMessage style={{fontSize: "20px", color: "white", backgroundColor: "#9cc2ff", borderRadius: "7px", padding: "3px"}} />
            <span className='span_messages_label'>Messages</span>
        </div>
        <div id='div_messages_options'>
          <motion.button id='btn_create_gc' onClick={() => { setisCreateGCToggle(true) }}>
            <BiGroup style={{ fontSize: "20px" }} />
            <span id='span_btn_label' className='tw-font-Inter'>Create Group Chat</span>
          </motion.button>
          <motion.button id='btn_create_server' onClick={() => { setisCreateServerToggle(true) }}>
            <TbServer2 style={{ fontSize: "20px" }} />
            <span id='span_btn_label' className='tw-font-Inter'>Create Server</span>
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
                              {istypinglist.filter((flt: any) => flt.conversationID === msgslst.conversationID).length > 0 ? (
                                <span className='span_messages_list_name'>is typing...</span>
                              ) : (
                                <span className='span_messages_list_name'>{msgslst.sender == authentication.user.userID? "you: ": ""} 
                                  {
                                    msgslst.messageType === "text" || msgslst.messageType === "notif"? msgslst.content : !msgslst.messageType.includes("image") && !msgslst.messageType.includes("video") && !msgslst.messageType.includes("audio") ? `Sent ${messageTypeChecker["any"]}` : `Sent ${messageTypeChecker[msgslst.messageType.split("/")[0]]}`
                                  }
                                </span>
                              )}
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
                          <span className='span_messages_list_name tw-flex tw-items-end tw-gap-[3px] tw-text-[#1c7DEF]'>{msgslst.groupdetails.groupName} <BiGroup style={{ fontSize: "20px", color: "#1c7DEF" }} /></span>
                          {istypinglist.filter((flt: any) => flt.conversationID === msgslst.conversationID).length > 0 ? (
                            <span className='span_messages_list_name'>someone is typing...</span>
                          ) : (
                            <span className='span_messages_list_name'>{msgslst.sender == authentication.user.userID? "you: ": ""}
                              {
                                msgslst.messageType === "text" || msgslst.messageType === "notif" ? msgslst.content : !msgslst.messageType.includes("image") && !msgslst.messageType.includes("video") && !msgslst.messageType.includes("audio") ? `Sent ${messageTypeChecker["any"]}` : `Sent ${messageTypeChecker[msgslst.messageType.split("/")[0]]}`
                              }
                            </span>
                          )}
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
                  else if(msgslst.conversationType === "server"){
                    return(
                      <motion.div
                      whileHover={{
                        backgroundColor: "rgb(200, 200, 200)"
                      }}
                      onClick={() => {
                        navigate(`/servers/${msgslst.serverdetails?.serverID}`);
                      }}
                      key={i} className='div_messages_list_cards'>
                        <div id='div_img_cncts_container'>
                          <div id='div_img_search_profiles_container_cncts'>
                            <img src={ServerIcon} className='img_server_profiles_ntfs' />
                          </div>
                        </div>
                        <div id='div_messages_list_name'>
                          <span className='span_messages_list_name_server tw-flex tw-items-start tw-gap-[3px] tw-text-[#e69500]'>
                            <div className='tw-flex tw-flex-col'>
                              <span className='tw-text-[14px]'>{msgslst.serverdetails?.serverName}</span>
                              <span className='tw-text-[12px]'>{msgslst.groupdetails.groupName}</span>
                            </div>
                            <TbServer2 style={{ fontSize: "20px", color: "#e69500" }} />
                          </span>
                          {istypinglist.filter((flt: any) => flt.conversationID === msgslst.conversationID).length > 0 ? (
                            <span className='span_messages_list_name'>someone is typing...</span>
                          ) : (
                            <span className='span_messages_list_name'>{msgslst.sender == authentication.user.userID? "you: ": ""}
                              {
                                msgslst.messageType === "text" || msgslst.messageType === "notif" ? msgslst.content : !msgslst.messageType.includes("image") && !msgslst.messageType.includes("video") && !msgslst.messageType.includes("audio") ? `Sent ${messageTypeChecker["any"]}` : `Sent ${messageTypeChecker[msgslst.messageType.split("/")[0]]}`
                              }
                            </span>
                          )}
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