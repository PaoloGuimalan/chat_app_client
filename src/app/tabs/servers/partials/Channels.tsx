import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom"
import NoChannel from "./NoChannel";
import ServerIcon from '../../../../assets/imgs/servericon.png'
import ServerConversation from "./ServerConversation";
import { InitServerChannelsRequest } from "@/reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { ChannelsListInterface, ServerChannelsListInterface } from "@/reusables/vars/interfaces";
import { FaHashtag, FaLocationArrow } from "react-icons/fa6";
import { motion } from "framer-motion";
import { SET_CONVERSATION_SETUP } from "@/redux/types";
import { conversationsetupstate } from "@/redux/actions/states";

function Channels() {

  const messageslist = useSelector((state: any) => state.messageslist);
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const dispatch = useDispatch();
  const params = useParams();
  const urllocation = useLocation();
  const navigate = useNavigate();

  const serverID = useMemo(() => params.serverID, [params]);

  const [serverdetails, setserverdetails] = useState<ServerChannelsListInterface | null>(null);

  const InitServerChannelsProcess = () => {
    InitServerChannelsRequest({
      serverID: serverID
    }).then((response: any) => {
      // console.log(response.data[0]);
      setserverdetails(response.data[0]);
    }).catch((err) => {
      console.log(err);
    })
  }

  useEffect(() => {
    InitServerChannelsProcess();
  },[serverID, messageslist])

  return (
    <motion.div
    initial={{
      paddingLeft: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "0px" : "7px" : "0px"
    }}
    animate={{
      paddingLeft: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "0px" : "7px" : "0px"
    }} 
    className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-start tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]">
        <motion.div
        initial={{
          maxWidth: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "100%" : "0px" : "250px",
          borderBottomRightRadius: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "10px" : "0px" : "0px",
          borderTopRightRadius: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "10px" : "0px" : "0px",
          opacity: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? 1 : 0 : 1
        }}
        animate={{
          maxWidth: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "100%" : "0px" : "250px",
          borderBottomRightRadius: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "10px" : "0px" : "0px",
          borderTopRightRadius: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "10px" : "0px" : "0px",
          opacity: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? 1 : 0 : 1
        }}
        className="tw-bg-[#f1f1f2] tw-flex tw-flex-1 tw-flex-col tw-h-full tw-rounded-tl-[10px] tw-rounded-bl-[10px] tw-items-center tw-overflow-x-hidden">
          <div id='div_server_channel_header'>
            <div id='div_conversation_user'>
              <div id='div_img_cncts_container'>
                <div id='div_img_search_profiles_container_cncts'>
                  <img src={ServerIcon} className='img_gc_profiles_ntfs' />
                </div>
              </div>
              <div id='div_conversation_user_name'>
                <span className='span_server_name_label'>{serverdetails?.serverName}</span>
              </div>
            </div>
          </div>
          <div className="tw-bg-transparent tw-w-[calc(100%-16px)] tw-flex tw-flex-col tw-pl-[8px] tw-pr-[8px] tw-pt-[10px] tw-pb-[10px] tw-items-start">
            <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[7px]">
              <span className="tw-text-[14px] tw-font-semibold">{serverdetails?.channels && serverdetails?.channels.length > 0 && "Channels"}</span>
              <div className="tw-bg-transparent tw-gap-[3px] tw-w-[calc(100%-20px)] tw-pb-[5px] tw-pl-[10px] tw-pr-[10px] tw-flex tw-flex-1 tw-flex-col tw-items-start">
                {serverdetails?.channels.map((mp: ChannelsListInterface, i: number) => {
                  return(
                    <motion.div key={i}
                    initial={{
                      backgroundColor: "transparent"
                    }}
                    whileHover={{
                      backgroundColor: "#deddde"
                    }}
                    onClick={() => {
                      if(!urllocation.pathname.includes(mp.groupID)){
                        dispatch({
                            type: SET_CONVERSATION_SETUP,
                            payload:{
                                conversationsetup: conversationsetupstate
                            }
                        })
                        navigate(`/servers/${serverID}/${mp.groupID}`)
                      }
                    }}
                    className="tw-select-none tw-cursor-pointer tw-text-[13px] tw-flex tw-flex-row tw-items-center tw-gap-[4px] tw-p-[5px] tw-pt-[6px] tw-pb-[6px] tw-w-[calc(100%-10px)] tw-rounded-[4px]">
                      <FaHashtag />
                      <span className={`tw-bg-transparent tw-flex tw-flex-1 ${mp.messages.length > 0 && "tw-font-semibold"} `}>{mp.groupName}</span>
                      {urllocation.pathname.includes(mp.groupID) && (
                        <FaLocationArrow />
                      )}
                      {mp.messages.length > 0 && (
                        <span className='span_channel_messages_list_counts'>{mp.messages[0].unread}</span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
        initial={{
          maxWidth: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "0px" : "none" : "none"
        }}
        animate={{
          maxWidth: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "0px" : "none" : "none"
        }}
        className="tw-flex tw-flex-1 tw-h-full tw-overflow-x-hidden tw-rounded-tr-[10px] tw-rounded-br-[10px]">
          <Routes>
              <Route path="/" element={<NoChannel />} />
              <Route path="/:conversationID" element={<ServerConversation />} />
          </Routes>
        </motion.div>
    </motion.div>
  )
}

export default Channels