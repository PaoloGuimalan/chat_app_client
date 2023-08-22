import React from 'react'
import '../../styles/main/index.css'
import DefaultProfile from '../../assets/imgs/default.png'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AiOutlineSearch, AiOutlineHome, AiOutlineMessage, AiOutlineBell, AiOutlineLogout } from 'react-icons/ai'
import { BsMap } from 'react-icons/bs'
import { FiMap } from 'react-icons/fi'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { LogoutRequest } from '../../reusables/hooks/requests'

function Home() {

  const authentication = useSelector(state => state.authentication)
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
              <input type='text' placeholder='Search something...' id='input_search_box' />
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
          className='btn_navigations'><AiOutlineMessage style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          className='btn_navigations'><AiOutlineBell style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            logoutProcess()
          }}
          className='btn_navigations'><AiOutlineLogout style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
        </div>
      </div>
    </div>
  )
}

export default Home