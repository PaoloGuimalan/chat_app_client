import { motion } from "framer-motion";

function OverlayMessage({
  className,
  message,
}: {
  className: string;
  message: string;
}) {
  // `tw-z-[2] tw-absolute tw-h-[calc(98%-90px)] tw-max-h-[700px] tw-w-[calc(98%-20px)] tw-max-w-[calc(400px-20px)] tw-bg-white tw-opacity-[0.8] tw-flex tw-items-center tw-justify-center`
  return (
    <div className={className}>
      <div id="div_conversation_content_loader">
        <motion.div id="div_loader_request_overlay_message">
          <span className="tw-font-Inter tw-font-semibold tw-text-[14px] tw-text-black">
            {message}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default OverlayMessage;
