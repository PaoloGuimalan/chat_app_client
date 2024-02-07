import Modal from "@/app/reusables/Modal";
import { BsFileEarmarkPost } from "react-icons/bs";

 export function NewPostModal({ onclose }: any) {
  
  return (
    <Modal component={
      <div className="div_modal_container tw-max-w-[600px] tw-max-h-[500px]">
        <div id='div_modal_header'>
            <div className='div_modal_header_label'>
              <BsFileEarmarkPost style={{ fontSize: "20px" }} />
              <span className='span_modal_header_label tw-font-inter'>Create a Post</span>
            </div>
        </div>
        <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-1 tw-items-center tw-justify-center">
          <span className="tw-text-[14px] tw-text-[#888888] tw-font-semibold">Coming Soon</span>
        </div>
        <div id='div_create_cancel_btns'>
          <button className='btns_create_cancel'
            onClick={() => {
                    // processCreateGroupChat()
                }}
            >Create</button>
            <button className='btns_create_cancel'
                onClick={() => {
                    onclose(false)
                }}
            >Cancel</button>
        </div>
      </div>
    } />
  )
}