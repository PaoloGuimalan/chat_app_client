import { InitServerListRequest } from "@/reusables/hooks/requests";
import { motion } from "framer-motion"
import { useEffect, useState } from "react";
import ServerIcon from '../../../assets/imgs/servericon.png'
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import Default from "./partials/Default";
import Channels from "./partials/Channels";
import { useSelector } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
import { TbServer2 } from "react-icons/tb";

function Servers() {

  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const urllocation = useLocation();
  const navigate = useNavigate();

  const [serverlist, setserverlist] = useState<any[]>([]);
  const [isLoaded, setisLoaded] = useState<boolean>(false);

  useEffect(() => {
    InitServerListRequest().then((response) => {
      setserverlist(response);
      setTimeout(() => { setisLoaded(true); }, 1000)
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
      className="thinscroller tw-bg-[#d8d8da] tw-flex tw-flex-col tw-max-w-[70px] tw-items-center tw-pt-[10px] tw-pb-[10px] tw-overflow-x-hidden tw-overflow-y-auto">
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            navigate("/")
          }}
          className='btn_server_navigations'><IoArrowBack style={{fontSize: "25px", color: "#e69500"}} /></motion.button>
          <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6"
          }}
          onClick={() => {
            navigate("/servers")
          }}
          className='btn_server_navigations'><TbServer2 style={{fontSize: "25px", color: "#e69500"}} /></motion.button>
          <hr className="tw-w-[65%]" />
          <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[2px]">
            {isLoaded ? (
              serverlist.map((mp: any) => {
                return(
                  <motion.button
                  key={mp.serverID}
                  animate={{
                    backgroundColor: urllocation.pathname.includes(mp.serverID) ? "#e6e6e6" : "transparent"
                  }}
                  whileHover={{
                    backgroundColor: "#e69500"
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
              })
            ) : (
              Array.from({ length: 5 }).map((_: any, i: number) => {
                return(
                  <motion.button
                  key={i}
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
                  className='btn_server_navigations'>
                    <div id='div_img_cncts_container'>
                      {/* <div id='div_img_search_profiles_container_cncts'>
                        <img src={ServerIcon} className='img_server_profiles_ntfs' />
                      </div> */}
                    </div>
                  </motion.button>
                )
              })
            )}
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