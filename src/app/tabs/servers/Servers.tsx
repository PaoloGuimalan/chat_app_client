import { motion } from "framer-motion"
import { AiOutlineHome } from "react-icons/ai";
import { useNavigate } from "react-router-dom"

function Servers() {

  const navigate = useNavigate();

  return (
    <div className='tw-w-full tw-h-full tw-bg-[#f0f2f5] tw-absolute tw-z-[2] tw-flex tw-flex-row'>
      <div className="thinscroller tw-bg-white tw-flex tw-flex-col tw-flex-1 tw-max-w-[70px] tw-items-center tw-pt-[10px] tw-pb-[10px] tw-overflow-y-auto">
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
            
          </div>
      </div>
    </div>
  )
}

export default Servers