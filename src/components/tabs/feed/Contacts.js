import React from 'react'
import '../../../styles/tabs/feed/index.css'
import { FcContacts } from 'react-icons/fc'

function Contacts() {
  return (
    <div id='div_contacts'>
        <div id='div_contacts_label_container'>
          <FcContacts style={{fontSize: "28px"}} />
          <span className='span_contacts_label'>Contacts</span>
        </div>
    </div>
  )
}

export default Contacts