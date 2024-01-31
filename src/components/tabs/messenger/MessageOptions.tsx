import { DeleteMessageRequest } from "@/reusables/hooks/requests"
import { MessageOptionsProp } from "@/reusables/vars/props"
import { BsFillReplyFill } from "react-icons/bs"
import { MdDelete } from "react-icons/md"

function MessageOptions({ conversationID, messageID, type, setisReplying }: MessageOptionsProp) {

  const DeleteMessageProcess = () => {
    DeleteMessageRequest({
      conversationID: conversationID,
      messageID: messageID
    }).then((_) => {
      // console.log(response);
    }).catch((err) => {
      console.log(err);
    })
  }

  return (
    <div className={`tw-bg-transparent tw-flex tw-flex-1 tw-gap-[1px] ${type == "sender" ? "tw-justify-end tw-pr-[5px] tw-flex-row" : "tw-justify-end tw-pl-[5px] tw-flex-row-reverse"}`}>
        { type === "sender" && (
          <button onClick={() => { DeleteMessageProcess() }} className="tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none">
              <MdDelete style={{ fontSize: "17px", color: "#616466" }} />
          </button>
        ) }
        <button onClick={() => { setisReplying() }} className="tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none">
            <BsFillReplyFill style={{ fontSize: "17px", color: "#616466" }} />
        </button>
    </div>
  )
}

export default MessageOptions