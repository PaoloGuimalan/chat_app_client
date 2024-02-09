import Modal from "@/app/reusables/Modal"
import { ConversationInfoModalProp } from "@/reusables/vars/props";
import { IoMdClose } from "react-icons/io"
import { useNavigate } from "react-router-dom"
import DefaultProfile from '../../../../assets/imgs/default.png'
import GroupChatIcon from '../../../../assets/imgs/group-chat-icon.jpg'
import { useSelector } from "react-redux";
import { AuthenticationInterface, ConversationFilesInterface, UserWithInfoConversationInterface } from "@/reusables/vars/interfaces";
import { useState } from "react";
import { motion } from "framer-motion";

function ConversationInfoModal({ conversationinfo, onclose }: ConversationInfoModalProp) {

  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const navigate = useNavigate();

  const [toggleMemberDropper, settoggleMemberDropper] = useState<boolean>(false);

  return (
    <Modal component={
        <div className="div_modal_container tw-max-w-[800px] tw-max-h-[550px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            {conversationinfo.type == "single"? (
                <span className='tw-text-[14px] tw-font-semibold tw-flex tw-flex-1'
                >Conversation</span>
            ) : (
                <span className='tw-text-[14px] tw-font-semibold tw-flex tw-flex-1'>Group Chat</span>
            )}
            <button onClick={() => { onclose(false) }} className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer">
              <IoMdClose style={{ fontSize: "17px" }} />
            </button>
          </div>
          {conversationinfo.type === "single" ? (
            <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-h-[calc(100%-70px)] tw-flex-col lg:tw-flex-row tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-y-scroll lg:tw-overflow-y-none thinscroller">
                <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-items-center tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-flex-col tw-items-center tw-gap-[10px]">
                        <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                          <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-rounded-[120px] div_conversationinfomodalimg">
                            <img src={DefaultProfile} className='img_search_profiles_ntfs' />
                          </div>
                        </div>
                        <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                            {conversationinfo.usersWithInfo.filter((flt: any) => flt.userID !== authentication.user.userID)[0].fullname.firstName}
                            {conversationinfo.usersWithInfo.filter((flt: any) => flt.userID !== authentication.user.userID)[0].fullname.middleName !== "N/A" ? (
                                ` ${conversationinfo.usersWithInfo.filter((flt: any) => flt.userID !== authentication.user.userID)[0].fullname.middleName} `
                            ) : " "}
                            {conversationinfo.usersWithInfo.filter((flt: any) => flt.userID !== authentication.user.userID)[0].fullname.lastName}
                        </span>
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
                            {conversationinfo.usersWithInfo.map((mp: UserWithInfoConversationInterface, i: number) => {
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
                <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-p-[10px] tw-pr-[0px] tw-pt-[0px]">
                    <div className="tw-w-full tw-flex tw-items-center tw-h-[30px] tw-pb-[5px]">
                        <button className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer">Media</button>
                    </div>
                    <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[2px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                        {conversationinfo.conversationfiles.map((mp: ConversationFilesInterface, i: number) => {
                            if(mp.fileDetails.data){
                                return(
                                    <img key={i} src={mp.fileDetails.data}  className="tw-w-full tw-flex tw-flex-1 tw-max-h-[150px] tw-object-cover tw-bg-black" />
                                )
                            }
                        })}
                    </div>
                </div>
            </div>
          ) : (
            <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-h-[calc(100%-70px)] tw-flex-col lg:tw-flex-row tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-y-scroll lg:tw-overflow-y-none thinscroller">
                <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-items-center tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-flex-col tw-items-center tw-gap-[10px]">
                        <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                          <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-rounded-[120px] div_conversationinfomodalimg">
                            <img src={GroupChatIcon} className='img_gc_profiles_ntfs' />
                          </div>
                        </div>
                        <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">{conversationinfo.conversationInfo?.groupName}</span>
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
                            {conversationinfo.usersWithInfo.map((mp: UserWithInfoConversationInterface, i: number) => {
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
                <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-p-[10px] tw-pr-[0px] tw-pt-[0px]">
                    <div className="tw-w-full tw-flex tw-items-center tw-h-[30px] tw-pb-[5px]">
                        <button className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer">Media</button>
                    </div>
                    <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[2px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                        {conversationinfo.conversationfiles.map((mp: ConversationFilesInterface, i: number) => {
                            if(mp.fileDetails.data){
                                return(
                                    <img key={i} src={mp.fileDetails.data}  className="tw-w-full tw-flex tw-flex-1 tw-max-h-[150px] tw-object-cover tw-bg-black" />
                                )
                            }
                        })}
                    </div>
                </div>
            </div>
          ) }
      </div>
    } />
  )
}

export default ConversationInfoModal