import React, { useState } from 'react'
import '../../styles/modals/index.css'
import { BiGroup } from 'react-icons/bi'
import { useSelector } from 'react-redux'

function CreateGroupChatModal({ setisCreateGCToggle }) {

  const authentication = useSelector(state => state.authentication)

  const [gcName, setgcName] = useState(`${authentication.user.fullName.firstName}'s Group Chat`)
  const [gcprivacy, setgcprivacy] = useState(true)
  const [searchFilter, setsearchFilter] = useState("")

  return (
    <div id='div_creategroupcharmodal'>
        <div id='div_modal_container'>
            <div id='div_modal_header'>
                <div id='div_modal_header_label'>
                    <BiGroup style={{ fontSize: "20px" }} />
                    <span id='span_modal_header_label'>Create Group Chat</span>
                </div>
            </div>
            <div id='div_modal_input_fields'>
                <div id='div_modal_input_columns'>
                    <span id='span_input_label'>Name of Group Chat</span>
                    <input id='input_gc_name' 
                        value={gcName}
                        onChange={(e) => {
                            setgcName(e.target.value)
                        }}
                        type='text' placeholder="Type the group chat's name" 
                    />
                </div>
                <div id='div_modal_input_columns'>
                    <span id='span_input_label'>Privacy</span>
                    <div id='div_toggle_switch_container'>
                        <label class="switch">
                            <input type="checkbox" checked={gcprivacy} onChange={(e) => {
                                setgcprivacy(e.target.checked)
                            }} />
                            <span class="slider round"></span>
                        </label>
                        <span id='span_toggle_switch_label'>Group Chat is {gcprivacy? "Private" : "Public"}</span>
                    </div>
                </div>
                <div id='div_modal_input_columns'>
                    <span id='span_input_label'>Add People</span>
                    <input id='input_searchfilter' 
                        value={searchFilter}
                        onChange={(e) => {
                            setsearchFilter(e.target.value)
                        }}
                        type='text' placeholder="Type a name of a user" 
                    />
                </div>
            </div>
        </div>
        <div id='div_onBlur_container' onClick={() => { setisCreateGCToggle(false) }} />
    </div>
  )
}

export default CreateGroupChatModal