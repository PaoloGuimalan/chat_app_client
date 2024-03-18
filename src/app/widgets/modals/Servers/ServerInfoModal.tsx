import Modal from "@/app/reusables/Modal"
import { ServerInfoModalProp } from "@/reusables/vars/props"
import { motion } from "framer-motion"
import { IoMdClose } from "react-icons/io"
import DefaultProfile from '../../../../assets/imgs/default.png'
import ServerIcon from '../../../../assets/imgs/servericon.png'
import { useState } from "react"
import { IoCheckmark, IoClose } from "react-icons/io5"
import { MdOutlineGroupAdd } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { AddNewMemberToServer, ContactsListReusableRequest } from "@/reusables/hooks/requests"
import { AuthenticationInterface, ChannelMembersInterface, ServerUsersWithInfo } from "@/reusables/vars/interfaces"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

function ServerInfoModal({ serverdetails, onclose }: ServerInfoModalProp) {

  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const navigate = useNavigate();

  const [toggleMemberDropper, settoggleMemberDropper] = useState<boolean>(true);
  const [expandcontacts, setexpandcontacts] = useState<boolean>(false);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [searchFilter, _] = useState("");

  const [markedMembers, setmarkedMembers] = useState<any[]>([]);
  const [contactslist, setcontactslist] = useState<any[]>([]);

  const valueToArrayChecker = (userID: any) => {
    var userIDExistInArray = markedMembers.filter((flt: any) => flt.userID == userID)

    return userIDExistInArray.length > 0? true : false
  }

  const GetContactsListProcess = (bool: boolean) => {
    setexpandcontacts(bool);
    if(bool){
        ContactsListReusableRequest(setcontactslist, setisLoading);
    }
  }

  const removeFromList = (userID: any) => {
    var userIDnotSimilar = markedMembers.filter((flt: any) => flt.userID != userID);

    setmarkedMembers(userIDnotSimilar);
  }

  const AddNewMemberProcess = () => {
    const initialpayload = {
        serverID: serverdetails.serverID,
        memberstoadd: markedMembers,
        receivers: [...markedMembers.map((mp) => mp.userID)]
    }
    AddNewMemberToServer(initialpayload).then((response) => {
        if(response.data.status){
            setmarkedMembers([]);
            setexpandcontacts(false);
            // console.log(response.data);
        }
    }).catch((err) => {
        console.log(err);
    })
  }

  return (
    <Modal component={
        <div className="div_modal_container tw-max-w-[600px] tw-max-h-[550px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            <span className='tw-text-[14px] tw-font-semibold tw-flex tw-flex-1'>Server</span>
            <button onClick={() => { onclose(false) }} className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer">
              <IoMdClose style={{ fontSize: "17px" }} />
            </button>
          </div>
          <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-h-[calc(100%-70px)] tw-flex-col tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-y-scroll lg:tw-overflow-y-none thinscroller">
                <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-items-center tw-overflow-y-none thinscroller">
                    <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-flex-col tw-items-center tw-gap-[10px]">
                        <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                            <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-rounded-[120px] div_conversationinfomodalimg">
                                <img src={ServerIcon} className='img_gc_profiles_ntfs' />
                            </div>
                        </div>
                        <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">{serverdetails.serverName}</span>
                    </div>
                    <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-items-start">
                        <button onClick={() => { settoggleMemberDropper(!toggleMemberDropper) }} className="tw-font-Inter tw-border-[0px] tw-h-[35px] tw-text-[14px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer">
                            Members
                        </button>
                        <motion.div
                        initial={{
                            height: "0px"
                        }}
                        animate={{
                            height: toggleMemberDropper ? "auto" : "0px"
                        }}
                        className="tw-w-[calc(100%-40px)] tw-flex tw-gap-[5px] tw-flex-col tw-overflow-y-hidden tw-bg-transparent tw-items-start tw-pl-[20px] tw-pr-[20px]">
                            {expandcontacts && (
                                <motion.div
                                animate={{
                                    minHeight: markedMembers.length > 0? "40px" : "0px",
                                    height: markedMembers.length > 0? "40px" : "0px"
                                }}
                                id='div_selected_container' className='scrollervert'>
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
                            )}
                            <div onClick={() => {
                                GetContactsListProcess(!expandcontacts);
                            }} className="tw-w-[calc(100%-10px)] hover:tw-bg-[#f0f0f0] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer">
                                <div id='div_img_search_profiles_container_cncts' className="tw-bg-transparent tw-border-transparent">
                                    {expandcontacts ? (
                                        <IoClose style={{ fontSize: "20px" }} />
                                    ) : (
                                        <MdOutlineGroupAdd style={{ fontSize: "20px" }} />
                                    )}
                                </div>
                                <div className="tw-flex tw-flex-1 span_userdetails_ellipsis">
                                    <span className="tw-flex tw-flex-1 tw-text-[13px]">{expandcontacts ? "Close list" : "Add a user"}</span>
                                </div>
                            </div>
                            {markedMembers.length > 0 && expandcontacts && (
                                <div onClick={() => {
                                    AddNewMemberProcess();
                                }} className="tw-w-[calc(100%-10px)] hover:tw-text-white hover:tw-bg-[#1c7def] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer">
                                    <div id='div_img_search_profiles_container_cncts' className="tw-bg-transparent tw-border-transparent">
                                        <IoCheckmark style={{ fontSize: "20px" }} />
                                    </div>
                                    <div className="tw-flex tw-flex-1 span_userdetails_ellipsis">
                                        <span className="tw-flex tw-flex-1 tw-text-[13px]">Apply</span>
                                    </div>
                                </div>
                            )}
                            <motion.div className="tw-w-full tw-flex tw-flex-col"
                                initial={{
                                    height: "0px"
                                }}
                                animate={{
                                    height: expandcontacts ? "400px" : "0px"
                                }}
                            >
                                {isLoading ? (
                                    <div className='tw-w-full tw-flex tw-overflow-y-hidden tw-h-[400px] tw-items-center tw-justify-center'>
                                        <motion.div
                                        animate={{
                                            rotate: -360
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity
                                        }}
                                        id='div_loader_request'>
                                            <AiOutlineLoading3Quarters style={{fontSize: "28px"}} />
                                        </motion.div>
                                    </div>
                                ) : (
                                    <motion.div id='div_contacts_select_container' className='scroller tw-h-[400px]'
                                        // animate={{
                                        //     maxHeight: markedMembers.length > 0 ? "calc(100% - 520px)" : "calc(100% - 440px)"
                                        // }}
                                    >
                                        <div className='tw-w-full tw-flex tw-flex-col tw-h-auto'>
                                            {contactslist.map((cnts: any, i: number) => {
                                                if(cnts.type == "single"){
                                                    if(cnts.userdetails.userone && cnts.userdetails.usertwo){
                                                        if(cnts.userdetails.userone.userID === authentication.user.userID && serverdetails.members.filter((flt: ChannelMembersInterface) => flt.userID === cnts.userdetails.usertwo.userID).length === 0){
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
                                                                            <span className="tw-flex tw-flex-1 tw-text-[13px]">{cnts.userdetails.usertwo.fullname.firstName}{cnts.userdetails.usertwo.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.usertwo.fullname.middleName}`} {cnts.userdetails.usertwo.fullname.lastName}</span>
                                                                        </div>
                                                                    </motion.div>
                                                                )
                                                            }
                                                            else{
                                                                return null
                                                            }
                                                        }
                                                        else{
                                                            if(serverdetails.members.filter((flt: ChannelMembersInterface) => flt.userID === cnts.userdetails.usertwo.userID).length === 0){
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
                                                                                <span className="tw-flex tw-flex-1 tw-text-[13px]">{cnts.userdetails.userone.fullname.firstName}{cnts.userdetails.userone.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.userone.fullname.middleName}`} {cnts.userdetails.userone.fullname.lastName}</span>
                                                                            </div>
                                                                        </motion.div>
                                                                    )
                                                                }
                                                                else{
                                                                    return null
                                                                }
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
                                    </motion.div>
                                )}
                            </motion.div>
                            {serverdetails.usersWithInfo.map((mp: ServerUsersWithInfo, i: number) => {
                                return(
                                    <div key={i} onClick={() => {
                                        navigate(`/${mp.userID}`)
                                    }} className="tw-w-[calc(100%-10px)] hover:tw-bg-[#f0f0f0] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer">
                                        <div id='div_img_search_profiles_container_cncts'>
                                            <img src={mp.profile == "none"? DefaultProfile : mp.profile} className='img_search_profiles_ntfs' />
                                        </div>
                                        <div className="tw-flex tw-flex-1 span_userdetails_ellipsis">
                                            <span className="tw-flex tw-flex-1 tw-text-[13px]">{mp.fullname.firstName}{mp.fullname.middleName == "N/A"? "" : ` ${mp.fullname.middleName}`} {mp.fullname.lastName}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </motion.div>
                    </div>
                </div>
            </div>
      </div>
    } />
  )
}

export default ServerInfoModal