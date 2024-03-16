import { InitServerListRequest } from "@/reusables/hooks/requests";
import { motion } from "framer-motion"
import { useEffect, useState } from "react";
import { AiOutlineHome } from "react-icons/ai";
import ServerIcon from '../../../assets/imgs/servericon.png'
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import Default from "./partials/Default";
import Channels from "./partials/Channels";
import { useSelector } from "react-redux";

function Servers() {

  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const urllocation = useLocation();
  const navigate = useNavigate();

  const [serverlist, setserverlist] = useState<any[]>([])

  useEffect(() => {
    InitServerListRequest().then((response) => {
      setserverlist(response);
    }).catch((err) => {
      console.log(err);
    })
  },[]);

  return (
    <div className='tw-w-full tw-h-full tw-bg-[#d8d8da] tw-absolute tw-z-[2] tw-flex tw-flex-row'>
      <motion.div
      initial={{
        minWidth: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "70px" : "0px" : "70px",
        width: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "70px" : "0px" : "70px"
      }}
      animate={{
        minWidth: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "70px" : "0px" : "70px",
        width: screensizelistener.W <= 900 ? urllocation.pathname.split("/").length < 4 ? "70px" : "0px" : "70px"
      }}
      className="thinscroller tw-bg-[#d8d8da] tw-flex tw-flex-col tw-max-w-[70px] tw-items-center tw-pt-[10px] tw-pb-[10px] overflowx-hidden tw-overflow-y-auto">
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            navigate("/")
          }}
          className='btn_server_navigations'><AiOutlineHome style={{fontSize: "25px", color: "#4A4A4A"}} /></motion.button>
          <hr className="tw-w-[65%]" />
          <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[2px]">
            {serverlist.map((mp: any, i: number) => {
              return(
                <motion.button
                key={i}
                whileHover={{
                  backgroundColor: "#e6e6e6"
                }}
                onClick={() => {
                  navigate(`/servers/${mp.serverID}`);
                }}
                title={mp.serverName}
                className='btn_server_navigations'>
                  <div id='div_img_cncts_container'>
                    <div id='div_img_search_profiles_container_cncts'>
                      <img src={ServerIcon} className='img_server_profiles_ntfs' />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
      </motion.div>
      <Routes>
        <Route path="/" element={<Default />} />
        <Route path="/:serverID/*" element={<Channels />} />
      </Routes>
    </div>
  )
}

export default Servers