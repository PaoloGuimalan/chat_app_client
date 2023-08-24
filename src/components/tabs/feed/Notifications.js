import React from 'react'
import '../../../styles/tabs/feed/index.css'
import { AiOutlineBell } from 'react-icons/ai'

function Notifications() {
  return (
    <div id='div_notifications_main'>
      <div id='div_notifications_label_container'>
        <AiOutlineBell style={{fontSize: "20px", color: "#b66a00", backgroundColor: "#f2a43a", borderRadius: "7px", padding: "3px"}} />
        <span className='span_notifications_label'>Notifications</span>
      </div>
    </div>
  )
}

export default Notifications