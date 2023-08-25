import React from 'react'
import '../../../styles/tabs/feed/index.css'
import { FcContacts } from 'react-icons/fc'
import { useSelector } from 'react-redux'

function Contacts() {

  const contactslist = useSelector(state => state.contactslist)

  return (
    <div id='div_contacts'>
        <div id='div_contacts_label_container'>
          <FcContacts style={{fontSize: "28px"}} />
          <span className='span_contacts_label'>Contacts</span>
        </div>
        {contactslist.length == 0? (
          <div id='div_contacts_list_empty_container'>
            <span className='span_empty_list_label'>No Contacts</span>
          </div>
        ) : (
          <div id='div_contacts_list_container'></div>
        )}
    </div>
  )
}

export default Contacts