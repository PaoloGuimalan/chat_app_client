import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function OverlayLoader({ className }: { className: string }) {
  // `tw-z-[2] tw-absolute tw-h-[calc(98%-90px)] tw-max-h-[700px] tw-w-[calc(98%-20px)] tw-max-w-[calc(400px-20px)] tw-bg-white tw-opacity-[0.8] tw-flex tw-items-center tw-justify-center`
  return (
    <div className={className}>
      <div id="div_conversation_content_loader">
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          id="div_loader_request_conv"
        >
          <AiOutlineLoading3Quarters style={{ fontSize: "28px" }} />
        </motion.div>
      </div>
    </div>
  );
}

export default OverlayLoader;
