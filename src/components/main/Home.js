import React, { useState } from 'react'
import '../../styles/main/index.css'
import DefaultProfile from '../../assets/imgs/default.png'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AiOutlineSearch, AiOutlineHome, AiOutlineMessage, AiOutlineBell, AiOutlineLogout } from 'react-icons/ai'
import { BsMap } from 'react-icons/bs'
import { FiMap } from 'react-icons/fi'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { LogoutRequest } from '../../reusables/hooks/requests'
import Contacts from '../tabs/feed/Contacts'
import Feed from '../tabs/feed/Feed'
import Notifications from '../tabs/feed/Notifications'
import Messages from '../tabs/feed/Messages'
import SearchMiniDrawer from '../widgets/SearchMiniDrawer'

function Home() {

  const authentication = useSelector(state => state.authentication)
  const [toggleRightWidget, settoggleRightWidget] = useState("notifs")

  const [searchBoxFocus, setsearchBoxFocus] = useState(false)
  const [searchbox, setsearchbox] = useState("")

  const dispatch = useDispatch()

  const logoutProcess = () => {
    LogoutRequest({}, dispatch)
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
          className='btn_navigations'><AiOutlineHome style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          className='btn_navigations'><FiMap style={{fontSize: "22px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            settoggleRightWidget("messages")
          }}
          className='btn_navigations'><AiOutlineMessage style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            settoggleRightWidget("notifs")
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
      <div id='div_main_home'>
        <Contacts />
        <Feed />
        {toggleRightWidget == "notifs"? (
          <Notifications />
        ) : (
          <Messages />
        )}
      </div>
    </div>
  )
}

export default Home