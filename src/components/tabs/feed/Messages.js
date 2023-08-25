import React from 'react'
import '../../../styles/tabs/feed/index.css'
import { AiOutlineMessage } from 'react-icons/ai'
import { useSelector } from 'react-redux'

function Messages() {

  const messageslist = useSelector(state => state.messageslist)

  return (
    <div id='div_messages_main'>
      <div id='div_messages_label_container'>
          <AiOutlineMessage style={{fontSize: "20px", color: "white", backgroundColor: "#9cc2ff", borderRadius: "7px", padding: "3px"}} />
          <span className='span_messages_label'>Messages</span>
      </div>
      {messageslist.length == 0? (
          <div id='div_messages_list_empty_container'>
            <span className='span_empty_list_label'>No Messages</span>
          </div>
        ) : (
          <div id='div_messages_list_container'></div>
        )}
    </div>
  )
}

export default Messages