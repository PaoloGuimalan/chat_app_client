import { useEffect, useState } from 'react'
import '../../styles/styles.css'
import DefaultProfile from '../../assets/imgs/default.png'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AiOutlineSearch, AiOutlineHome, AiOutlineMessage, AiOutlineBell, AiOutlineLogout } from 'react-icons/ai'
import { FiMap } from 'react-icons/fi'
import { RiContactsBook2Line } from 'react-icons/ri'
import { ActiveContactsRequest, InitConversationListRequest, LogoutRequest } from '../../reusables/hooks/requests'
import Contacts from '../tabs/feed/Contacts'
import Notifications from '../tabs/feed/Notifications'
import Messages from '../tabs/feed/Messages'
import SearchMiniDrawer from '../widgets/SearchMiniDrawer'
import { CloseSSENotifications, SSENotificationsTRequest } from '../../reusables/hooks/sse'
import { CLEAR_PENDING_CALL_ALERTS, SET_CALLS_LIST, SET_CLEAR_ALERTS, SET_CONVERSATION_SETUP, SET_MESSAGES_LIST, SET_TOGGLE_RIGHT_WIDGET } from '../../redux/types'
import { conversationsetupstate } from '../../redux/actions/states'
import { Route, Routes, useNavigate } from 'react-router-dom'
import DesktopHome from './DesktopHome'
import CallCollection from '../absolutes/calls/CallCollection'
import { endSocket } from '../../reusables/hooks/sockets'
import MapFeed from '../tabs/mapfeed/MapFeed'

function Home() {

  const togglerightwidget = useSelector((state: any) => state.togglerightwidget)
  const authentication = useSelector((state: any) => state.authentication)
  const screensizelistener = useSelector((state: any) => state.screensizelistener)
  const messageslist = useSelector((state: any) => state.messageslist)
  const alerts = useSelector((state: any) => state.alerts)
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

    dispatch({
      type: SET_CLEAR_ALERTS,
      payload: {
        alerts: []
      }
    })

    dispatch({
      type: SET_CALLS_LIST,
      payload: {
        callslist: []
      }
    })

    dispatch({
      type: CLEAR_PENDING_CALL_ALERTS,
      payload: {
        clearstate: []
      }
    })
  }

  const logoutProcess = () => {
    clearStates()
    CloseSSENotifications()
    LogoutRequest(dispatch)
  }

  useEffect(() => {
    initEventSources()

    return () => {
      clearStates()
      endSocket()
    }
  },[])

  const initEventSources = () => {
    SSENotificationsTRequest(dispatch, alerts, authentication)
    InitConversationListRequest(dispatch, () => {})
    ActiveContactsRequest(dispatch)
    
    initPushNotification()
  }

  const initPushNotification = () => {
    if(Notification.permission === "denied" || Notification.permission === "default"){
      Notification.requestPermission().then((_) => {
        //check if granted after allow
      })
    }
  }

  const settogglerightwidget = (toggle: any) => {
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
      <CallCollection />
      <div id='div_home_navigations' className='tw-z-[1]'>
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
            navigate("/")
          }}
          className='btn_navigations'><AiOutlineHome style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            navigate("/mapfeed")
          }}
          className='btn_navigations'><FiMap style={{fontSize: "22px", color: "#4A4A4A"}} /></motion.button>
          {screensizelistener.W <= 1100 && (
            <motion.button
            whileHover={{
              backgroundColor: "#e6e6e6"
            }}
            onClick={() => {
              navigate("/contacts")
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
              navigate("/messages")
            }
            else{
              settogglerightwidget("messages")
            }
          }}
          className='btn_navigations'>
           {messageslist.length > 0 && (
              messageslist.map((msgs: any) => msgs.unread).reduce((prev: any, next: any) => prev + next) > 0 && (
                <span className='span_icon_counts'>{messageslist.map((msgs: any) => msgs.unread).reduce((prev: any, next: any) => prev + next)}</span>
              )
           )}
            <AiOutlineMessage style={{fontSize: "25px", color: "#4A4A4A"}} />
          </motion.button>
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
              navigate("/notifications")
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
        <Route path='/mapfeed' element={<MapFeed />}/>
      </Routes>
    </div>
  )
}

export default Home