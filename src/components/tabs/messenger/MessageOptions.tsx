import { MessageOptionsProp } from "@/reusables/vars/props"
import { BsFillReplyFill } from "react-icons/bs"
import { MdDelete } from "react-icons/md"

function MessageOptions({ type }: MessageOptionsProp) {
  return (
    <div className={`tw-bg-transparent tw-flex tw-flex-1 tw-gap-[1px] ${type == "sender" ? "tw-justify-end tw-pr-[5px] tw-flex-row" : "tw-justify-end tw-pl-[5px] tw-flex-row-reverse"}`}>
        <button className="tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none">
            <MdDelete style={{ fontSize: "17px", color: "#616466" }} />
        </button>
        <button className="tw-flex tw-items-center tw-justify-center tw-h-[30px] tw-cursor-pointer tw-bg-transparent tw-border-none">
            <BsFillReplyFill style={{ fontSize: "17px", color: "#616466" }} />
        </button>
    </div>
  )
}

export default MessageOptions