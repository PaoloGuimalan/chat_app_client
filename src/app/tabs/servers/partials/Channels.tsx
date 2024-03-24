import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom"
import NoChannel from "./NoChannel";
import ServerIcon from '../../../../assets/imgs/servericon.png'
import ServerConversation from "./ServerConversation";
import { InitServerChannelsRequest } from "@/reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { ChannelsListInterface, ServerChannelsListInterface } from "@/reusables/vars/interfaces";
import { FaHashtag, FaLocationArrow, FaLock } from "react-icons/fa6";
import { motion } from "framer-motion";
import { SET_CONVERSATION_SETUP } from "@/redux/types";
import { conversationsetupstate } from "@/redux/actions/states";
// import { FcInfo } from "react-icons/fc";
import ServerInfoModal from "@/app/widgets/modals/Servers/ServerInfoModal";
import { IoMdAdd } from "react-icons/io";
import CreateChannelModal from "@/app/widgets/modals/Servers/CreateChannelModal";
import { BiSolidInfoCircle } from "react-icons/bi";

function Channels() {

  const messageslist = useSelector((state: any) => state.messageslist);
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const dispatch = useDispatch();
  const params = useParams();
  const urllocation = useLocation();
  const navigate = useNavigate();

  const serverID = useMemo(() => params.serverID, [params]);

  const [serverdetails, setserverdetails] = useState<ServerChannelsListInterface | null>(null);
  const [toggleserverinfomodal, settoggleserverinfomodal] = useState<boolean>(false);
  const [toggleserveraddchannelmodal, settoggleserveraddchannelmodal] = useState<boolean>(false);
  const [isLoaded, setisLoaded] = useState<boolean>(false);

  const InitServerChannelsProcess = () => {
    InitServerChannelsRequest({
      serverID: serverID
    }).then((response: any) => {
      // console.log(response.data[0]);
      setserverdetails(response.data[0]);
      setTimeout(() => { setisLoaded(true); }, 1000)
    }).catch((err) => {
      console.log(err);
    })
  }

  useEffect(() => {
    setisLoaded(false);
  },[serverID]);

  useEffect(() => {
    InitServerChannelsProcess();
  },[serverID, messageslist]);

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
        className="tw-bg-[#f1f1f2] tw-shadow-lg tw-flex tw-flex-1 tw-flex-col tw-h-full tw-rounded-tl-[10px] tw-rounded-bl-[10px] tw-items-center tw-overflow-x-hidden">
          <div id='div_server_channel_header'>
            <div id='div_conversation_user' className="tw-items-center">
              {isLoaded ? (
                <div id='div_img_cncts_container'>
                  <div id='div_img_search_profiles_container_cncts'>
                    <img src={ServerIcon} className='img_gc_profiles_ntfs' />
                  </div>
                </div>
              ) : (
                <motion.button
                initial={{
                  backgroundColor: "#d2d2d2"
                }}
                animate={{
                  backgroundColor: "#9c9c9c"
                }}
                transition={{
                  duration: 0.7,
                  delay: 0,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className='btn_server_navigations'>
                  <div id='div_img_search_profiles_container_cncts' />
                </motion.button>
              )}
              {isLoaded ? (
                <div id='div_conversation_user_name'>
                  <span className='span_server_name_label'>{serverdetails?.serverName}</span>
                </div>
              ) : (
                <motion.div
                initial={{
                  backgroundColor: "#d2d2d2"
                }}
                animate={{
                  backgroundColor: "#9c9c9c"
                }}
                transition={{
                  duration: 0.7,
                  delay: 0,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="tw-select-none tw-h-[12px] tw-text-[13px] tw-flex tw-flex-row tw-items-center tw-gap-[4px] tw-p-[5px] tw-pt-[6px] tw-pb-[6px] tw-w-[100%] tw-rounded-[4px]" />
              )}
              <div id='div_conversation_header_navigations'>
                {toggleserverinfomodal && serverdetails && (
                  <ServerInfoModal serverdetails={serverdetails} onclose={settoggleserverinfomodal} />
                )}
                <motion.button
                whileHover={{
                  backgroundColor: "#e6e6e6"
                }}
                className='btn_conversation_header_navigation' disabled={serverdetails ? false : true} onClick={() => { 
                  settoggleserverinfomodal(!toggleserverinfomodal);
                }}><BiSolidInfoCircle style={{fontSize: "25px", color: "#e69500"}} /></motion.button>
              </div>
            </div>
          </div>
          <div className="tw-bg-transparent tw-w-[calc(100%-16px)] tw-flex tw-flex-col tw-pl-[8px] tw-pr-[8px] tw-pt-[10px] tw-pb-[10px] tw-items-start">
            <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[7px]">
              <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-w-full tw-items-center">
                <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1">{serverdetails?.channels && serverdetails?.channels.length > 0 && "Channels"}</span>
                {toggleserveraddchannelmodal && (
                  <CreateChannelModal serverID={serverdetails?.serverID} setisCreateChannelToggle={settoggleserveraddchannelmodal} servermemberslist={serverdetails?.usersWithInfo} />
                )}
                {serverdetails?.channels && serverdetails?.channels.length > 0 && (
                  <button onClick={() => { settoggleserveraddchannelmodal(!toggleserveraddchannelmodal) }} className="tw-w-[30px] tw-h-[30px] tw-p-0 tw-flex tw-items-center tw-justify-center tw-border-none tw-rounded-[7px] hover:tw-bg-[#ffc965] hover:tw-text-white tw-cursor-pointer"> {/** bg hover #d8d8da */}
                    <IoMdAdd style={{ fontSize: "17px" }} />
                  </button>
                )}
              </div>
              <div className="tw-bg-transparent tw-gap-[3px] tw-w-[calc(100%-20px)] tw-pb-[5px] tw-pl-[10px] tw-pr-[10px] tw-flex tw-flex-1 tw-flex-col tw-items-start">
                {isLoaded ? (
                  serverdetails?.channels.map((mp: ChannelsListInterface) => {
                    return(
                      <motion.div 
                      key={mp.groupID}
                      initial={{
                        backgroundColor: "transparent",
                        color: urllocation.pathname.includes(mp.groupID) ? "#e69500" : "black"
                      }}
                      animate={{
                        color: urllocation.pathname.includes(mp.groupID) ? "#e69500" : "black"
                      }}
                      whileHover={{
                        backgroundColor: "#ffc965",
                        color: "white"
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
                        {mp.privacy ? (
                          <FaLock style={{ fontSize: "13px" }} />
                        ): (
                          <FaHashtag />
                        )}
                        <span className={`tw-bg-transparent tw-flex ${urllocation.pathname.includes(mp.groupID) ? "tw-font-semibold" : "tw-font-normal"} tw-flex-1 ${mp.messages.length > 0 && "tw-font-semibold"} `}>{mp.groupName}</span>
                        {urllocation.pathname.includes(mp.groupID) && (
                          <FaLocationArrow />
                        )}
                        {mp.messages.length > 0 && (
                          <span className='span_channel_messages_list_counts'>{mp.messages[0].unread}</span>
                        )}
                      </motion.div>
                    )
                  })
                ) : (
                  Array.from({ length: 5 }).map((_: any, i: number) => {
                    return(
                      <motion.div key={i}
                      initial={{
                        backgroundColor: "#d2d2d2"
                      }}
                      animate={{
                        backgroundColor: "#9c9c9c"
                      }}
                      transition={{
                        duration: 0.7,
                        delay: i - 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="tw-select-none tw-h-[12px] tw-text-[13px] tw-flex tw-flex-row tw-items-center tw-gap-[4px] tw-p-[5px] tw-pt-[6px] tw-pb-[6px] tw-w-[calc(100%-10px)] tw-rounded-[4px]" />
                    )
                  })
                )}
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