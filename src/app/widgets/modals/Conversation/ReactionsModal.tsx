import Modal from "@/app/reusables/Modal"
import { IoMdClose } from "react-icons/io"
import DefaultProfile from '../../../../assets/imgs/default.png'

function ReactionsModal({ reactions, onclose }: any) {

  console.log(reactions)

  return (
    <Modal component={
      <div className="div_modal_container tw-max-w-[400px] tw-max-h-[300px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1">Reactions</span>
            <button onClick={() => { onclose(false) }} className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer">
              <IoMdClose style={{ fontSize: "17px" }} />
            </button>
          </div>
          <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-flex-1 tw-overflow-y-auto thinscroller">
              {reactions.map((mp: any, i: number) => {
                return(
                  <div key={i} className="tw-w-[calc(100%-10px)] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px]">
                    <div id='div_img_search_profiles_container_cncts'>
                      <img src={mp.profile == "none"? DefaultProfile : mp.profile} className='img_search_profiles_ntfs' />
                    </div>
                    <div className="tw-flex tw-flex-1 span_userdetails_ellipsis tw-items-center">
                      {mp.fullname && (
                        <span className="tw-flex tw-flex-1 tw-text-[14px] tw-font-Inter">{mp.fullname.firstName}{mp.fullname.middleName == "N/A"? "" : ` ${mp.fullname.middleName}`} {mp.fullname.lastName}</span>
                      )}
                      <span className="tw-text-[18px]">{mp.emoji}</span>
                    </div>
                  </div>
                )
              })}
          </div>
      </div>
    } />
  )
}

export default ReactionsModal