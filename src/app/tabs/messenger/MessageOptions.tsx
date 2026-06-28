/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeleteMessageRequest } from "@/reusables/hooks/requests";
import { MessageOptionsProp } from "@/reusables/vars/props";
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsFillReplyFill } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";

function MessageOptions({
  conversationID,
  messageID,
  type,
  setisReplying,
}: MessageOptionsProp) {
  const [isDeleting, setisDeleting] = useState<boolean>(false);
  const authentication = useSelector((state: any) => state.authentication);
  const conversationsetup = useSelector((state: any) => state.conversationsetup);
  const senderEntityID =
    conversationsetup?.sender_entity_id ||
    conversationsetup?.acting_entity_id ||
    conversationsetup?.senderEntityID ||
    conversationsetup?.joinedAsEntityID ||
    conversationsetup?.groupdetails?.sender_entity_id ||
    conversationsetup?.groupdetails?.acting_entity_id ||
    conversationsetup?.groupdetails?.senderEntityID ||
    (authentication.user?.userID
      ? `entity:user:${authentication.user.userID}`
      : null);

  const DeleteMessageProcess = () => {
    setisDeleting(true);
    DeleteMessageRequest({
      conversationID: conversationID,
      messageID: messageID,
      ...(senderEntityID ? { sender_entity_id: senderEntityID } : {}),
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
      {type === "sender" &&
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
    </div>
  );
}

export default MessageOptions;
