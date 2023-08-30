import React, { useEffect, useState } from 'react'
import '../../styles/main/index.css'
import DefaultProfile from '../../assets/imgs/default.png'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AiOutlineSearch, AiOutlineHome, AiOutlineMessage, AiOutlineBell, AiOutlineLogout } from 'react-icons/ai'
import { BsMap } from 'react-icons/bs'
import { FiMap } from 'react-icons/fi'
import { RiContactsBook2Line } from 'react-icons/ri'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { LogoutRequest, NotificationInitRequest } from '../../reusables/hooks/requests'
import Contacts from '../tabs/feed/Contacts'
import Feed from '../tabs/feed/Feed'
import Notifications from '../tabs/feed/Notifications'
import Messages from '../tabs/feed/Messages'
import SearchMiniDrawer from '../widgets/SearchMiniDrawer'
import { CloseSSENotifications, SSENotificationsTRequest } from '../../reusables/hooks/sse'
import { SET_CONVERSATION_SETUP, SET_MESSAGES_LIST, SET_TOGGLE_RIGHT_WIDGET } from '../../redux/types'
import { conversationsetupstate } from '../../redux/actions/states'
import { Route, Routes, useNavigate } from 'react-router-dom'
import DesktopHome from './DesktopHome'

function Home() {

  const togglerightwidget = useSelector(state => state.togglerightwidget)
  const authentication = useSelector(state => state.authentication)
  const screensizelistener = useSelector(state => state.screensizelistener)
  const alerts = useSelector(state => state.alerts)
  // const [togglerightwidget, settogglerightwidget] = useState("notifs")

  const [searchBoxFocus, setsearchBoxFocus] = useState(false)
  const [searchbox, setsearchbox] = useState("")

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const clearStates = () => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload:{
        conversationsetup: conversationsetupstate
      }
    })

    dispatch({
      type: SET_MESSAGES_LIST,
        payload: {
            messageslist: []
        }
    })
  }

  const logoutProcess = () => {
    clearStates()
    CloseSSENotifications()
    LogoutRequest({}, dispatch)
  }

  useEffect(() => {
    initEventSources()

    return () => {
      clearStates()
    }
  },[])

  const initEventSources = () => {
    SSENotificationsTRequest({}, dispatch, alerts, authentication)
  }

  const settogglerightwidget = (toggle) => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload:{
        conversationsetup: conversationsetupstate
      }
    })
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload:{
        togglerightwidget: toggle
      }
    })
  }

  return (
    <div id='div_home'>
      <div id='div_home_navigations'>
        <div id='div_profile_search_container'>
          <motion.div
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          id='img_profile_container'>
            <div id='img_default_profile_container'>
              <img src={DefaultProfile} id='img_default_profile' />
            </div>
            <span id='span_user_firstname_label'>{authentication.user.fullName.firstName}</span>
          </motion.div>
          <div id='div_search_container'>
            <div id='div_input_container'>
              <AiOutlineSearch style={{fontSize: "20px", color: "#4A4A4A"}} />
              <input value={searchbox} onChange={(e) => { setsearchbox(e.target.value) }} onFocus={() => { setsearchBoxFocus(true) }} onBlur={() => { setTimeout(() => { setsearchBoxFocus(false) }, 500) }} type='text' placeholder='Search something...' id='input_search_box' />
            </div>
          </div>
        </div>
        <div id='div_buttons_navigation'>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            navigate("/app")
          }}
          className='btn_navigations'><AiOutlineHome style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          className='btn_navigations'><FiMap style={{fontSize: "22px", color: "#4A4A4A"}} /></motion.button>
          {screensizelistener.W <= 1100 && (
            <motion.button
            whileHover={{
              backgroundColor: "#e6e6e6"
            }}
            onClick={() => {
              navigate("/app/contacts")
            }}
            className='btn_navigations'><RiContactsBook2Line style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          )}
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            if(screensizelistener.W <= 900){
              dispatch({
                type: SET_CONVERSATION_SETUP,
                payload:{
                  conversationsetup: conversationsetupstate
                }
              })
              navigate("/app/messages")
            }
            else{
              settogglerightwidget("messages")
            }
          }}
          className='btn_navigations'><AiOutlineMessage style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            if(screensizelistener.W <= 900){
              dispatch({
                type: SET_CONVERSATION_SETUP,
                payload:{
                  conversationsetup: conversationsetupstate
                }
              })
              navigate("/app/notifications")
            }
            else{
              settogglerightwidget("notifs")
            }
          }}
          className='btn_navigations'><AiOutlineBell style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          initial={{
            color: "#4A4A4A"
          }}
          whileHover={{
            backgroundColor: "#ff6675",
            color: "white"
          }}
          onClick={() => {
            logoutProcess()
          }}
          className='btn_navigations'><AiOutlineLogout style={{fontSize: "25px"}} /></motion.button>
        </div>
      </div>
      {searchBoxFocus && (
        <SearchMiniDrawer searchbox={searchbox} />
      )}
      <Routes>
        <Route path='/' element={<DesktopHome togglerightwidget={togglerightwidget} />} />
        <Route path='/messages' element={<Messages />} />
        <Route path='/notifications' element={<Notifications />} />
        <Route path='/contacts' element={<Contacts />} />
      </Routes>
    </div>
  )
}

export default Home