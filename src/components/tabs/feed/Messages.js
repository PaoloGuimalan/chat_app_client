import React from 'react'
import '../../../styles/tabs/feed/index.css'
import { AiOutlineMessage } from 'react-icons/ai'

function Messages() {
  return (
    <div id='div_messages_main'>
      <div id='div_messages_label_container'>
          <AiOutlineMessage style={{fontSize: "20px", color: "white", backgroundColor: "#9cc2ff", borderRadius: "7px", padding: "3px"}} />
          <span className='span_messages_label'>Messages</span>
      </div>
    </div>
  )
}

export default Messages