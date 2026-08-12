/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeleteMessageRequest } from "@/reusables/hooks/requests";
import { MessageOptionsProp } from "@/reusables/vars/props";
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsFillReplyFill } from "react-icons/bs";
import { MdDelete, MdReport } from "react-icons/md";
import { motion } from "framer-motion";
import ReportModal from "@/app/widgets/modals/ReportModal";

function MessageOptions({
  conversationID,
  messageID,
  type,
  setisReplying,
}: MessageOptionsProp) {
  const [isDeleting, setisDeleting] = useState<boolean>(false);
  const [isReportOpen, setisReportOpen] = useState<boolean>(false);

  // "sender" means the message is yours - Delete replaces Report, exactly the
  // way it does in the post menu. Reporting your own message would resolve to
  // your own entity and be rejected server-side anyway.
  const isOwnMessage = type === "sender";

  const DeleteMessageProcess = () => {
    setisDeleting(true);
    DeleteMessageRequest({
      conversationID: conversationID,
      messageID: messageID,
    })
      .then((_) => {
        setTimeout(() => {
          setisDeleting(false);
        }, 1000);
        // console.log(response);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div
      className={`cl-message-actions tw-bg-transparent tw-flex tw-flex-1 tw-gap-[1px] ${
        type == "sender"
          ? "tw-justify-end tw-pr-[5px] tw-flex-row"
          : "tw-justify-end tw-pl-[5px] tw-flex-row-reverse"
      }`}
    >
      {isOwnMessage &&
        (isDeleting ? (
          <div
            id="divlazyloader"
            className="tw-h-[30px] tw-bg-transparent tw-flex tw-items-center tw-justify-center tw--mt-[0px] tw-mb-[0px]"
          >
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
              <AiOutlineLoading3Quarters style={{ fontSize: "18px" }} />
            </motion.div>
          </div>
        ) : (
          <button
            onClick={() => {
              DeleteMessageProcess();
            }}
            className="cl-message-options-button cl-message-options-button--danger tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none"
          >
            <MdDelete style={{ fontSize: "15px" }} />
          </button>
        ))}
      <button
        onClick={() => {
          setisReplying();
        }}
        className="cl-message-options-button tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none"
      >
        <BsFillReplyFill style={{ fontSize: "15px" }} />
      </button>
      {!isOwnMessage && (
        <button
          onClick={() => {
            setisReportOpen(true);
          }}
          aria-label="Report message"
          title="Report"
          className="cl-message-options-button tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none"
        >
          <MdReport style={{ fontSize: "15px" }} />
        </button>
      )}
      {isReportOpen && (
        <ReportModal
          targetType="message"
          targetId={messageID}
          onClose={() => setisReportOpen(false)}
        />
      )}
    </div>
  );
}

export default MessageOptions;
