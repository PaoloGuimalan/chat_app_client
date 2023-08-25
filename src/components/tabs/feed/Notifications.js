import React from 'react'
import '../../../styles/tabs/feed/index.css'
import { AiOutlineBell } from 'react-icons/ai'
import { useSelector } from 'react-redux'

function Notifications() {

  const notificationslist = useSelector(state => state.notificationslist)

  return (
    <div id='div_notifications_main'>
      <div id='div_notifications_label_container'>
        <AiOutlineBell style={{fontSize: "20px", color: "#b66a00", backgroundColor: "#f2a43a", borderRadius: "7px", padding: "3px"}} />
        <span className='span_notifications_label'>Notifications</span>
      </div>
      {notificationslist.length == 0? (
          <div id='div_notifications_list_empty_container'>
            <span className='span_empty_list_label'>No Notifications</span>
          </div>
        ) : (
          <div id='div_notifications_list_container'></div>
        )}
    </div>
  )
}

export default Notifications