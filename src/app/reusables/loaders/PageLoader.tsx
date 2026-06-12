import { AiOutlineLoading3Quarters } from "react-icons/ai";
// import { IoArrowBack } from "react-icons/io5";
import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";

function PageLoader() {
  // const navigate = useNavigate();

  return (
    <div className="tw-bg-[var(--background)] tw-text-[var(--text)] tw-w-full tw-h-full tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
      {/* <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[100] tw-shadow-lg tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-flex tw-items-center tw-justify-center tw-text-[var(--text)] tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
      </button> */}
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
          <AiOutlineLoading3Quarters
            style={{ fontSize: "25px", color: "var(--text)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default PageLoader;
