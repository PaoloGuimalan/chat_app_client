import React, { useEffect, useState } from 'react'
import '../../App.css'
import DefaultProfile from '../../assets/imgs/default.png'
import GroupChatIcon from '../../assets/imgs/group-chat-icon.jpg'
import { motion } from 'framer-motion';
import { AiFillCheckCircle, AiOutlineClose, AiFillInfoCircle, AiFillWarning, AiFillCloseCircle } from 'react-icons/ai'
import { IoMdClose, IoMdCloseCircle } from 'react-icons/io'
import { BiSolidPhoneCall } from 'react-icons/bi'
import { HiPhoneMissedCall } from 'react-icons/hi'
import { useSelector } from 'react-redux';

function Alert({al}) {

  const alerts = useSelector(state => state.alerts)
  const [timerUnToggle, settimerUnToggle] = useState(true);
  const [displayUntoggle, setdisplayUntoggle] = useState(true);

  useEffect(() => {
    if(al.type != "incomingcall"){
      setTimeout(() => {
          settimerUnToggle(false)
      }, 3000)
      setTimeout(() => {
          setdisplayUntoggle(false)
      },3500)
    }
    else{
      setTimeout(() => {
          settimerUnToggle(false)
      }, 60000)
      setTimeout(() => {
          setdisplayUntoggle(false)
      },60500)
    }
  }, [])

  const alertIcons = {
    success: {
      title: "Success",
      component: <AiFillCheckCircle style={{ fontSize: "25px", color: "white" }} />
    },
    info: {
      title: "Info",
      component: <AiFillInfoCircle style={{ fontSize: "25px", color: "white" }} />
    },
    warning: {
      title: "Warning",
      component: <AiFillWarning style={{ fontSize: "25px", color: "white" }} />
    },
    error: {
      title: "Error",
      component: <IoMdCloseCircle style={{ fontSize: "25px", color: "white" }} />
    },
    incomingcall: {
      title: "Incoming Call",
      component: null
    }
  }

  return (
    al.type == "incomingcall"? (
      <motion.div
      initial={{
          marginLeft: "-800px"
      }}
      animate={{
          marginLeft: timerUnToggle? "0px" : "-800px",
          display: displayUntoggle? "flex" : "none"
      }}
      className={`div_alerts_prompt ${al.type}`}>
          <div id='div_header_alert'>
          {alertIcons[al.type].component}
          <span id='span_header_label_ic'>{alertIcons[al.type].title} ({al.callmetadata.callType == "audio"? "Audio" : "Video"})</span>
          <div id='div_close_alert_container_ic'>
              <button id='btn_close_alert'>
                <BiSolidPhoneCall style={{fontSize: "25px", color: "#45EF56"}} />
              </button>
              <button id='btn_close_alert'>
                <HiPhoneMissedCall style={{fontSize: "25px", color: "red"}} />
              </button>
          </div>
          </div>
          <div id='div_alert_content_container_ic'>
            <div id='div_img_alert_container'>
              {al.callmetadata.conversationType == "single"? (
                  <img src={al.callmetadata.displayImage == "none"? DefaultProfile : al.callmetadata.displayImage} className='img_search_profiles_ntfs' />
              ) : (
                  <img src={GroupChatIcon} className='img_gc_profiles_ntfs' />
              )}
            </div>
            <p id='p_alert_content_ic'>{al.content}</p>
          </div>
      </motion.div>
    ) : (
      <motion.div
      initial={{
          marginLeft: "-800px"
      }}
      animate={{
          marginLeft: timerUnToggle? "0px" : "-800px",
          display: displayUntoggle? "flex" : "none"
      }}
      className={`div_alerts_prompt ${al.type}`}>
          <div id='div_header_alert'>
          {alertIcons[al.type].component}
          <span id='span_header_label'>{alertIcons[al.type].title}</span>
          <div id='div_close_alert_container'>
              <button id='btn_close_alert'>
                <IoMdClose style={{ fontSize: "20px", color: "white", fontWeight: "bold" }} />
              </button>
          </div>
          </div>
          <div id='div_alert_content_container'>
          <p id='p_alert_content'>{al.content}</p>
          </div>
      </motion.div>
    )
  )
}

export default Alert