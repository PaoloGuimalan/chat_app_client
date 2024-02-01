import { DeleteMessageRequest } from "@/reusables/hooks/requests"
import { MessageOptionsProp } from "@/reusables/vars/props"
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsFillReplyFill } from "react-icons/bs"
import { MdDelete } from "react-icons/md"
import { motion } from "framer-motion";

function MessageOptions({ conversationID, messageID, type, setisReplying }: MessageOptionsProp) {

  const [isDeleting, setisDeleting] = useState<boolean>(false);

  const DeleteMessageProcess = () => {
    setisDeleting(true);
    DeleteMessageRequest({
      conversationID: conversationID,
      messageID: messageID
    }).then((_) => {
      setTimeout(() => {
        setisDeleting(false);
      },1000);
      // console.log(response);
    }).catch((err) => {
      console.log(err);
    })
  }

  return (
    <div className={`tw-bg-transparent tw-flex tw-flex-1 tw-gap-[1px] ${type == "sender" ? "tw-justify-end tw-pr-[5px] tw-flex-row" : "tw-justify-end tw-pl-[5px] tw-flex-row-reverse"}`}>
        { type === "sender" && (
          isDeleting? (
            <div id='divlazyloader' className='tw-h-[30px] tw-bg-transparent tw-flex tw-items-center tw-justify-center tw--mt-[0px] tw-mb-[0px]'>
                <motion.div
                  animate={{
                      rotate: -360
                  }}
                  transition={{
                      duration: 1,
                      repeat: Infinity
                  }}
                  id='div_loader_request_conv'>
                      <AiOutlineLoading3Quarters style={{fontSize: "18px"}} />
                </motion.div>
            </div>
          ) : (
            <button onClick={() => { DeleteMessageProcess() }} className="tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none">
                <MdDelete style={{ fontSize: "17px", color: "#616466" }} />
            </button>
          )
        ) }
        <button onClick={() => { setisReplying() }} className="tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none">
            <BsFillReplyFill style={{ fontSize: "17px", color: "#616466" }} />
        </button>
    </div>
  )
}

export default MessageOptions