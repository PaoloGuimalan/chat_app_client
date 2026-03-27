import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function PageLoader() {
  const navigate = useNavigate();

  return (
    <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[100] tw-shadow-lg tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px" }} />
      </button>
      <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-gap-[15px] tw-items-center tw-justify-center">
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          id="div_loader_request"
        >
          <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
        </motion.div>
      </div>
    </div>
  );
}

export default PageLoader;
