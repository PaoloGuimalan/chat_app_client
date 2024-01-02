import { useState } from 'react'
import '../../styles/modals/index.css'
import { IoClose } from 'react-icons/io5'
import { BiGroup } from 'react-icons/bi'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import DefaultProfile from '../../assets/imgs/default.png'
import { CreateGroupChatRequest } from '../../reusables/hooks/requests'

function CreateGroupChatModal({ setisCreateGCToggle }: any) {

  const authentication = useSelector((state: any) => state.authentication)
  const contactslist = useSelector((state: any) => state.contactslist)

  const [gcName, setgcName] = useState(`${authentication.user.fullName.firstName}'s Group Chat`)
  const [gcprivacy, setgcprivacy] = useState(true)
  const [searchFilter, setsearchFilter] = useState("")
  const [markedMembers, setmarkedMembers] = useState<any[]>([])

  const valueToArrayChecker = (userID: any) => {
    var userIDExistInArray = markedMembers.filter((flt: any) => flt.userID == userID)

    return userIDExistInArray.length > 0? true : false
  }

  const removeFromList = (userID: any) => {
    var userIDnotSimilar = markedMembers.filter((flt: any) => flt.userID != userID)

    setmarkedMembers(userIDnotSimilar)
  }

  const processCreateGroupChat = () => {
    var markedMembersFinal = markedMembers.map((mrkd: any) => (mrkd.userID))
    CreateGroupChatRequest({
        groupName: gcName,
        privacy: gcprivacy,
        otherUsers: markedMembersFinal
    }, setisCreateGCToggle)
  }

  return (
    <div id='div_creategroupcharmodal'>
        <div id='div_modal_container'>
            <div id='div_modal_header'>
                <div id='div_modal_header_label'>
                    <BiGroup style={{ fontSize: "20px" }} />
                    <span id='span_modal_header_label'>Create Group Chat</span>
                </div>
            </div>
            <div id='div_modal_input_fields' className='scroller'>
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
                        <label className="switch">
                            <input type="checkbox" checked={gcprivacy} onChange={(e) => {
                                setgcprivacy(e.target.checked)
                            }} />
                            <span className="slider round"></span>
                        </label>
                        <span id='span_toggle_switch_label'>Group Chat is {gcprivacy? "Private" : "Public"}</span>
                    </div>
                </div>
                <div id='div_modal_input_columns_add_people'>
                    <div id='div_input_filter_container'>
                        <span id='span_input_label'>Add People</span>
                        <input id='input_searchfilter' 
                            value={searchFilter}
                            onChange={(e) => {
                                setsearchFilter(e.target.value)
                            }}
                            type='text' placeholder="Type a name of a user" 
                        />
                    </div>
                    <motion.div
                    animate={{
                        display: markedMembers.length > 0? "flex" : "none"
                    }}
                    id='div_selected_container'>
                        {markedMembers.map((mrkm: any, i: number) => {
                            return(
                                <div key={i} className='div_selected_holder'>
                                    <span className='span_selected_label'>{mrkm.fullName}</span>
                                    <button className='btn_remove_selected' onClick={() => {
                                        removeFromList(mrkm.userID)
                                    }}>
                                        <IoClose style={{ fontSize: "17px", color: "white" }} />
                                    </button>
                                </div>
                            )
                        })}
                    </motion.div>
                    <div id='div_contacts_select_container' className='scroller'>
                        {contactslist.map((cnts: any, i: number) => {
                            if(cnts.type == "single"){
                                if(cnts.userdetails.userone && cnts.userdetails.usertwo){
                                    if(cnts.userdetails.userone.userID == authentication.user.userID){
                                        var fullNameFilter = `${cnts.userdetails.usertwo.fullname.firstName}${cnts.userdetails.usertwo.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.usertwo.fullname.middleName}`} ${cnts.userdetails.usertwo.fullname.lastName}`
                                        if(fullNameFilter.includes(searchFilter)){
                                            return(
                                                <motion.div
                                                whileHover={{
                                                backgroundColor: "#e6e6e6"
                                                }}
                                                key={i} className='div_cncts_cards'>
                                                    <input type="checkbox" checked={valueToArrayChecker(cnts.userdetails.usertwo.userID)}
                                                    onChange={() => {
                                                        if(!valueToArrayChecker(cnts.userdetails.usertwo.userID)){
                                                                setmarkedMembers([
                                                                ...markedMembers,
                                                                {
                                                                    userID: cnts.userdetails.usertwo.userID,
                                                                    fullName: `${cnts.userdetails.usertwo.fullname.firstName}${cnts.userdetails.usertwo.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.usertwo.fullname.middleName}`} ${cnts.userdetails.usertwo.fullname.lastName}`
                                                                }
                                                            ])
                                                        }
                                                        else{
                                                            removeFromList(cnts.userdetails.usertwo.userID)
                                                        }
                                                    }}
                                                    className='checkbox_selector_people' />
                                                    <div id='div_img_cncts_container'>
                                                        <div id='div_img_search_profiles_container_cncts'>
                                                        <img src={cnts.userdetails.usertwo.profile == "none"? DefaultProfile : cnts.userdetails.usertwo.profile} className='img_search_profiles_ntfs' />
                                                        </div>
                                                    </div>
                                                    <div className='div_contact_fullname_container'>
                                                        <span className='span_cncts_fullname_label'>{cnts.userdetails.usertwo.fullname.firstName}{cnts.userdetails.usertwo.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.usertwo.fullname.middleName}`} {cnts.userdetails.usertwo.fullname.lastName}</span>
                                                    </div>
                                                </motion.div>
                                            )
                                        }
                                        else{
                                            return null
                                        }
                                    }
                                    else{
                                        var fullNameFilter = `${cnts.userdetails.userone.fullname.firstName}${cnts.userdetails.userone.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.userone.fullname.middleName}`} ${cnts.userdetails.userone.fullname.lastName}`
                                        if(fullNameFilter.includes(searchFilter)){
                                            return(
                                                <motion.div
                                                whileHover={{
                                                backgroundColor: "#e6e6e6"
                                                }}
                                                key={i} className='div_cncts_cards'>
                                                    <input type="checkbox" checked={valueToArrayChecker(cnts.userdetails.userone.userID)}
                                                    onChange={() => {
                                                        if(!valueToArrayChecker(cnts.userdetails.userone.userID)){
                                                            setmarkedMembers([
                                                                ...markedMembers,
                                                                {
                                                                    userID: cnts.userdetails.userone.userID,
                                                                    fullName: `${cnts.userdetails.userone.fullname.firstName}${cnts.userdetails.userone.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.userone.fullname.middleName}`} ${cnts.userdetails.userone.fullname.lastName}`
                                                                }
                                                            ])
                                                        }
                                                        else{
                                                            removeFromList(cnts.userdetails.userone.userID)
                                                        }
                                                    }}
                                                    className='checkbox_selector_people' />
                                                    <div id='div_img_cncts_container'>
                                                        <div id='div_img_search_profiles_container_cncts'>
                                                        <img src={cnts.userdetails.userone.profile == "none"? DefaultProfile : cnts.userdetails.userone.profile} className='img_search_profiles_ntfs' />
                                                        </div>
                                                    </div>
                                                    <div className='div_contact_fullname_container'>
                                                        <span className='span_cncts_fullname_label'>{cnts.userdetails.userone.fullname.firstName}{cnts.userdetails.userone.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.userone.fullname.middleName}`} {cnts.userdetails.userone.fullname.lastName}</span>
                                                    </div>
                                                </motion.div>
                                            )
                                        }
                                        else{
                                            return null
                                        }
                                    }
                                }
                                else{
                                    return null
                                }
                            }
                            else{
                                return null
                            }
                        })}
                    </div>
                    <div id='div_create_cancel_btns'>
                        <button className='btns_create_cancel'
                            onClick={() => {
                                processCreateGroupChat()
                            }}
                        >Create</button>
                        <button className='btns_create_cancel'
                            onClick={() => {
                                setisCreateGCToggle(false)
                            }}
                        >Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        <div id='div_onBlur_container' onClick={() => { setisCreateGCToggle(false) }} />
    </div>
  )
}

export default CreateGroupChatModal