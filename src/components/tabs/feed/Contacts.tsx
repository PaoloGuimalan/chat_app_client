import { useState, useEffect } from 'react'
import '../../../styles/styles.css'
import { FcContacts } from 'react-icons/fc'
import { AiOutlineLoading3Quarters, AiOutlineMessage } from 'react-icons/ai'
import { BiUserMinus } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ContactsListInitRequest } from '../../../reusables/hooks/requests'
import DefaultProfile from '../../../assets/imgs/default.png'
import { SET_CONVERSATION_SETUP, SET_TOGGLE_RIGHT_WIDGET } from '../../../redux/types'
import { useNavigate } from 'react-router-dom'
import { conversationsetupstate } from '../../../redux/actions/states'
import { isUserOnline } from '../../../reusables/hooks/reusable'

function Contacts() {

  const activeuserslist = useSelector((state: any) => state.activeuserslist)
  const authentication = useSelector((state: any) => state.authentication)
  const contactslist = useSelector((state: any) => state.contactslist)
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [isLoading, setisLoading] = useState(true)

  useEffect(() => {
    ContactsListInitRequest(dispatch, setisLoading)
  },[])

  const settogglerightwidget = (toggle: any) => {
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload:{
        togglerightwidget: toggle
      }
    })
  }

  const navigateToConversation = (type: any, conversationID: any, userdetails: any) => {
    if(screensizelistener.W <= 1100){
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
        navigate("/messages")
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
        navigate("/messages")
      }
    }
    else{
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
        settogglerightwidget("messages")
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
        settogglerightwidget("messages")
      }
    }
  }

  return (
    <motion.div
    animate={{
      display: pathnamelistener.includes("contacts")? "flex" : screensizelistener.W <= 1100? "none" : "flex",
      maxWidth: pathnamelistener.includes("contacts")? "600px" : screensizelistener.W <= 900? "350px" : "350px"
    }}
    id='div_contacts'>
        <div id='div_contacts_label_container'>
          <FcContacts style={{fontSize: "28px"}} />
          <span className='span_contacts_label'>Contacts</span>
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
          contactslist.length == 0? (
            <div id='div_contacts_list_empty_container'>
              <span className='span_empty_list_label'>No Contacts</span>
            </div>
          ) : (
            <div id='div_contacts_list_container' className='scroller'>
              {contactslist.map((cnts: any, i: number) => {
                if(cnts.type == "single"){
                  if(cnts.userdetails.userone && cnts.userdetails.usertwo){
                    if(cnts.userdetails.userone.userID == authentication.user.userID){
                      return(
                        <motion.div
                        whileHover={{
                          backgroundColor: "#e6e6e6"
                        }}
                        key={i} className='div_cncts_cards'>
                          <div id='div_img_cncts_container'>
                            <div id='div_img_search_profiles_container_cncts'>
                              <img src={cnts.userdetails.usertwo.profile == "none"? DefaultProfile : cnts.userdetails.usertwo.profile} className='img_search_profiles_ntfs' />
                            </div>
                            {isUserOnline(activeuserslist, cnts.userdetails.usertwo.userID) && (
                              <div className='div_online_indicator' />
                            )}
                          </div>
                          <div className='div_contact_fullname_container'>
                            <span className='span_cncts_fullname_label'>{cnts.userdetails.usertwo.fullname.firstName}{cnts.userdetails.usertwo.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.usertwo.fullname.middleName}`} {cnts.userdetails.usertwo.fullname.lastName}</span>
                          </div>
                          <div className='div_cncts_navigations'>
                            <motion.button
                            initial={{
                              backgroundColor: "transparent",
                              color: "#9cc2ff"
                            }}
                            whileHover={{
                              backgroundColor: "#9cc2ff",
                              color: "white"
                            }}
                            onClick={() => {
                              navigateToConversation("single", cnts.contactID, cnts.userdetails.usertwo)
                            }}
                            className='btn_cncts_navigations'><AiOutlineMessage style={{fontSize: "20px", borderRadius: "7px", padding: "3px"}} /></motion.button>
                            <motion.button
                            initial={{
                              backgroundColor: "transparent",
                              color: "#ff6675"
                            }}
                            whileHover={{
                              backgroundColor: "#ff6675",
                              color: "white"
                            }}
                            className='btn_cncts_navigations'><BiUserMinus style={{fontSize: "20px", borderRadius: "7px", padding: "3px"}} /></motion.button>
                          </div>
                        </motion.div>
                      )
                    }
                    else{
                      return(
                        <motion.div
                        whileHover={{
                          backgroundColor: "#e6e6e6"
                        }}
                        key={i} className='div_cncts_cards'>
                          <div id='div_img_cncts_container'>
                            <div id='div_img_search_profiles_container_cncts'>
                              <img src={cnts.userdetails.userone.profile == "none"? DefaultProfile : cnts.userdetails.userone.profile} className='img_search_profiles_ntfs' />
                            </div>
                            {isUserOnline(activeuserslist, cnts.userdetails.userone.userID) && (
                              <div className='div_online_indicator' />
                            )}
                          </div>
                          <div className='div_contact_fullname_container'>
                            <span className='span_cncts_fullname_label'>{cnts.userdetails.userone.fullname.firstName}{cnts.userdetails.userone.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.userone.fullname.middleName}`} {cnts.userdetails.userone.fullname.lastName}</span>
                          </div>
                          <div className='div_cncts_navigations'>
                            <motion.button
                            initial={{
                              backgroundColor: "transparent",
                              color: "#9cc2ff"
                            }}
                            whileHover={{
                              backgroundColor: "#9cc2ff",
                              color: "white"
                            }}
                            onClick={() => {
                              navigateToConversation("single", cnts.contactID, cnts.userdetails.userone)
                            }}
                            className='btn_cncts_navigations'><AiOutlineMessage style={{fontSize: "20px", borderRadius: "7px", padding: "3px"}} /></motion.button>
                            <motion.button
                            initial={{
                              backgroundColor: "transparent",
                              color: "#ff6675"
                            }}
                            whileHover={{
                              backgroundColor: "#ff6675",
                              color: "white"
                            }}className='btn_cncts_navigations'><BiUserMinus style={{fontSize: "20px", borderRadius: "7px", padding: "3px"}} /></motion.button>
                          </div>
                        </motion.div>
                      )
                    }
                  }
                  else{
                    return null
                  }
                }
                else{
                  return null
                }
              })}
            </div>
          )
        )}
    </motion.div>
  )
}

export default Contacts