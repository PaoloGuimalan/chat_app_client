import Modal from "@/app/reusables/Modal";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import { importNonImageData } from "@/reusables/hooks/reusable";
import { useState } from "react";
import { BsFileEarmarkPost, BsPinMapFill } from "react-icons/bs";
import { FaGlobeAsia } from "react-icons/fa";
import { FaUserTag } from "react-icons/fa6";
import { MdAddToPhotos } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import PostMediaPreview from "./PostMediaPreview";
import { CreatePostRequest } from "@/reusables/hooks/requests";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { BiSolidImageAdd } from "react-icons/bi";

 export function NewPostModal({ withImage, profileInfo, setcreateposttext, getpostprocess, onclose }: any) {

  const authentication = useSelector((state: any) => state.authentication);

  const [isuploadingpost, setisuploadingpost] = useState<boolean>(false);
  const [iswithImage, setiswithImage] = useState<boolean>(withImage);

  const [mainpostcaption, setmainpostcaption] = useState<string>("");
  const [_, setcurrenttab] = useState<string>("content"); //currenttab
  const [__, setrawmedialist] = useState<any[]>([]); //rawmedialist
  const [medialist, setmedialist] = useState<any[]>([]);
  const [taggedList, ___] = useState<string[]>([]);
  const dispatch = useDispatch();

  const sendNonImageFilesProcess = () => {
    importNonImageData((arr: any) => {
        if(arr){
            if(arr.type.includes("image")){
              setmedialist((prev: any) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        name: null,
                        reference: arr.data,
                        caption: "",
                        referenceMediaType: "image"
                    }
                ])
            }
            else if(arr.type.includes("video")){
              setmedialist((prev: any) => [
                    ...prev,
                    {
                      id: prev.length + 1,
                      name: null,
                      reference: arr.data,
                      caption: "",
                      referenceMediaType: "video"
                    }
                ])
            }
            else{
              dispatch({ type: SET_MUTATE_ALERTS, payload:{
                  alerts: {
                      type: "warning",
                      content: "Photos and Videos are only allowed"
                  }
              }})
            }
        }
        else{
            dispatch({ type: SET_MUTATE_ALERTS, payload:{
                alerts: {
                    type: "warning",
                    content: "Cannot upload files greater than 25mb"
                }
            }})
        }
    }, (rawFiles: any) => {
        if(rawFiles){
            if(rawFiles.type.includes("image")){
              setrawmedialist((prev) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        name: null,
                        reference: rawFiles.data,
                        caption: "",
                        referenceMediaType: "image"
                    }
                ])
            }
            else if(rawFiles.type.includes("video")){
                // console.log(rawFiles)
                setrawmedialist((prev: any) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        name: rawFiles.name,
                        reference: rawFiles.data,
                        caption: "",
                        referenceMediaType: "video"
                    }
                ])   
            }
        }
    })
  }

  const CreatePostProcess = () => {
    if(mainpostcaption.trim() !== "" || medialist.length > 0){
      setisuploadingpost(true);
      const validatedTaggedList = authentication.user.userID == profileInfo?.userID ? [] : [profileInfo?.userID, ...taggedList]

      CreatePostRequest({
        content: {
            isShared: false,
            references: medialist,
            data: mainpostcaption
        },
        type: {
            fileType: medialist.length > 0 ? "media" : "text", //text, image, video, file
            contentType: medialist.length > 0 ? "media" : "text" //text, image, video
        },
        tagging: {
            isTagged: validatedTaggedList.length > 0 ? true : false,
            users: validatedTaggedList
        },
        privacy: {
            status: "public",
            users: [], //userID for filteration depending on status
        }, //public, friends, filtered
        onfeed: "feed",
      }).then((response) => {
          if(response.data.status){
              // console.log(response.data);
              onclose(false);
              setisuploadingpost(false);
              setcreateposttext("");
              dispatch({ 
                  type: SET_MUTATE_ALERTS, 
                  payload:{
                      alerts: {
                          type: "success",
                          content: "Your post has been saved"
                      }
                  }
              })
              getpostprocess();
          }
      }).catch((err) => {
          console.log(err);
      })
    }
    else{
      dispatch({ 
        type: SET_MUTATE_ALERTS, 
        payload:{
            alerts: {
                type: "warning",
                content: "Please provide a caption or media"
            }
          }
      })
    }
  }
  
  return (
    <Modal component={
      <div className={`div_modal_container tw-max-w-[600px] ${iswithImage ? "tw-max-h-[600px]" : "tw-max-h-[250px]"}`}>
        {isuploadingpost && (
          <div className={`tw-absolute tw-h-full tw-w-full tw-max-w-[600px] ${iswithImage ? "tw-max-h-[600px]" : "tw-max-h-[250px]"} tw-bg-white tw-opacity-[0.8] tw-flex tw-items-center tw-justify-center`}>
            <div id='div_conversation_content_loader'>
              <motion.div
                animate={{
                  rotate: -360
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity
                }}
                id='div_loader_request_conv'>
                    <AiOutlineLoading3Quarters style={{fontSize: "28px"}} />
                </motion.div>
            </div>
          </div>
        )}
        <div id='div_modal_header'>
            <div className='div_modal_header_label'>
              <BsFileEarmarkPost style={{ fontSize: "20px" }} />
              <span className='span_modal_header_label tw-font-inter'>Create a Post</span>
            </div>
        </div>
        <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-flex-1 tw-items-center tw-justify-center tw-pl-[10px] tw-pr-[10px] tw-pb-[10px] scroller tw-overflow-y-auto">
          <div className="tw-w-full tw-h-full tw-bg-transparent tw-flex tw-flex-col">
            <textarea value={mainpostcaption} onChange={(e) => { setcreateposttext(e.target.value); setmainpostcaption(e.target.value) }} className="tw-w-full tw-min-h-[80px] tw-font-inter tw-resize-none tw-border-none tw-outline-none thinscroller" placeholder="Type your caption"  />
            {iswithImage && (
              <div className="tw-flex tw-flex-1 tw-flex-col tw-w-full tw-gap-[12px] tw-bg-transparent tw-rounded-[7px] scroller">
                {medialist.length > 0 ? (
                  <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px]">
                    {
                      medialist.sort(function(a, b) { 
                        return a.id - b.id  ||  a.name.localeCompare(b.name);
                      }).map((mp: any) => {
                        return(
                          <PostMediaPreview key={mp.id} mp={mp} setrawmedialist={setrawmedialist} setmedialist={setmedialist} />
                        )
                      })
                    }
                    <div onClick={() => { sendNonImageFilesProcess() }} className="tw-select-none tw-cursor-pointer tw-flex tw-flex-1 tw-flex-row tw-gap-[12px] tw-min-h-[70px] tw-bg-transparent tw-border-solid tw-border-[1px] tw-border-[#888888] tw-border-dashed tw-rounded-[7px] tw-items-center tw-justify-center">
                      <MdAddToPhotos style={{ fontSize: "20px", color: "#888888" }} />
                      <span className="tw-text-[14px] tw-font-semibold tw-text-[#888888]">Add a Photo or Video</span>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { sendNonImageFilesProcess() }} className="tw-select-none tw-cursor-pointer tw-flex tw-flex-1 tw-flex-col tw-gap-[12px] tw-h-full tw-bg-transparent tw-border-solid tw-border-[1px] tw-border-[#888888] tw-border-dashed tw-rounded-[7px] tw-items-center tw-justify-center">
                    <MdAddToPhotos style={{ fontSize: "60px", color: "#888888" }} />
                    <span className="tw-text-[14px] tw-font-semibold tw-text-[#888888]">Add a Photo or Video</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="tw-w-[calc(100%-20px)] tw-flex tw-flex-row tw-gap-[5px] tw-pl-[10px] tw-pr-[10px] tw-pt-[5px]">
          <button onClick={() => { setcurrenttab("privacy") }} className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[#194888]">
            <FaGlobeAsia style={{ fontSize: "20px" }} />
          </button>
          <button onClick={() => { setiswithImage(true) }} className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[#1c7DEF]">
            <BiSolidImageAdd style={{ fontSize: "24px" }} />
          </button>
          <button onClick={() => { setcurrenttab("content") }} className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[#1c7DEF]">
            <BsFileEarmarkPost style={{ fontSize: "20px" }} />
          </button>
          <button onClick={() => { setcurrenttab("tagging") }} className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[#58c472]">
            <FaUserTag style={{ fontSize: "20px" }} />
          </button>
          <button onClick={() => { setcurrenttab("mapfeedstatus") }} className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[#f66551]">
            <BsPinMapFill style={{ fontSize: "18px" }} />
          </button>
        </div>
        <div id='div_create_cancel_btns'>
          <button className='btns_create_cancel'
            onClick={() => {
                    CreatePostProcess();
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