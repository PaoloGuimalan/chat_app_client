/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import { AiOutlineClose, AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { BsFileEarmarkPost } from "react-icons/bs";
import { useState } from "react";
import { MdAddToPhotos } from "react-icons/md";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import { useDispatch } from "react-redux/es/hooks/useDispatch";
import { importNonImageData } from "@/reusables/hooks/reusable";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { FaGlobeAsia } from "react-icons/fa";
import { CreatePostRequest } from "@/reusables/hooks/requests";

function UploadProfileMedia({
  type,
  getpostprocess,
  onclose,
}: {
  type: string;
  onclose: (state: boolean) => void;
  getpostprocess: () => void;
}) {
  const [isuploadingpost, setisuploadingpost] = useState<boolean>(false);
  const [mainpostcaption, setmainpostcaption] = useState<string>("");

  const [_, setcurrenttab] = useState<string>("content"); //currenttab
  const [medialist, setmedialist] = useState<any>(null);
  const [__, setrawmedialist] = useState<any>(null);
  const dispatch = useDispatch();

  const sendNonImageFilesProcess = () => {
    importNonImageData(
      (arr: any) => {
        if (arr) {
          if (arr.type.includes("image")) {
            setmedialist({
              id: 1,
              name: null,
              reference: arr.data,
              caption: "",
              referenceMediaType: "image",
            });
          } else if (arr.type.includes("video")) {
            setmedialist({
              id: 1,
              name: null,
              reference: arr.data,
              caption: "",
              referenceMediaType: "video",
            });
          } else {
            dispatch({
              type: SET_MUTATE_ALERTS,
              payload: {
                alerts: {
                  type: "warning",
                  content: "Photos are only allowed",
                },
              },
            });
          }
        } else {
          dispatch({
            type: SET_MUTATE_ALERTS,
            payload: {
              alerts: {
                type: "warning",
                content: "Cannot upload files greater than 25mb",
              },
            },
          });
        }
      },
      (rawFiles: any) => {
        if (rawFiles) {
          if (rawFiles.type.includes("image")) {
            setrawmedialist({
              id: 1,
              name: null,
              reference: rawFiles.data,
              caption: "",
              referenceMediaType: "image",
            });
          } else if (rawFiles.type.includes("video")) {
            // console.log(rawFiles)
            setrawmedialist({
              id: 1,
              name: rawFiles.name,
              reference: rawFiles.data,
              caption: "",
              referenceMediaType: "video",
            });
          }
        }
      },
    );
  };

  const CreatePostProcess = () => {
    if (medialist) {
      setisuploadingpost(true);
      const validatedTaggedList: any[] = [];

      // console.log(validatedTaggedList);

      CreatePostRequest({
        content: {
          isShared: false,
          references: [medialist],
          data: mainpostcaption,
        },
        type: {
          fileType: "media", //text, image, video, file
          contentType: type, //text, image, video
        },
        tagging: {
          isTagged: validatedTaggedList.length > 0 ? true : false,
          users: validatedTaggedList,
        },
        privacy: {
          status: "public",
          users: [], //userID for filteration depending on status
        }, //public, friends, filtered
        onfeed: "feed",
      })
        .then((response: any) => {
          if (response.data.status) {
            // console.log(response.data);
            onclose(false);
            setisuploadingpost(false);
            dispatch({
              type: SET_MUTATE_ALERTS,
              payload: {
                alerts: {
                  type: "success",
                  content: "Your post has been saved",
                },
              },
            });
            getpostprocess();
          }
        })
        .catch((err: any) => {
          console.log(err);
        });
    } else {
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: {
            type: "warning",
            content: "Please provide a caption or media",
          },
        },
      });
    }
  };

  return (
    <Modal
      component={
        <div
          className={`div_modal_container tw-max-w-[600px] tw-max-h-[600px]`}
        >
          {isuploadingpost && (
            <div
              className={`tw-absolute tw-h-full tw-w-full tw-max-w-[600px] tw-max-h-[520px] tw-bg-white tw-opacity-[0.8] tw-flex tw-items-center tw-justify-center`}
            >
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
          )}
          <div id="div_modal_header">
            <div className="div_modal_header_label">
              <BsFileEarmarkPost style={{ fontSize: "20px" }} />
              <span className="span_modal_header_label tw-font-inter">
                {type === "profile" && "Upload Profile Picture"}
                {type === "cover_photo" && "Upload Cover Photo"}
              </span>
            </div>
          </div>
          <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-items-center tw-justify-center tw-pl-[10px] tw-pr-[10px] tw-pb-[10px] scroller tw-overflow-y-auto">
            {" "}
            {/**tw-flex tw-flex-1 */}
            <div className="tw-w-full tw-h-full tw-bg-transparent tw-flex tw-flex-col">
              <textarea
                disabled={isuploadingpost}
                value={mainpostcaption}
                onChange={(e) => {
                  setmainpostcaption(e.target.value);
                }}
                className="tw-w-full tw-min-h-[80px] tw-font-inter tw-resize-none tw-border-none tw-outline-none thinscroller tw-font-Inter"
                placeholder="Type your caption"
              />
              <div className="tw-flex tw-h-[300px] tw-flex-col tw-w-full tw-gap-[12px] tw-bg-transparent tw-rounded-[7px] scroller">
                {medialist === null ? (
                  <div
                    onClick={() => {
                      sendNonImageFilesProcess();
                    }}
                    className="tw-select-none tw-cursor-pointer tw-flex tw-flex-1 tw-flex-col tw-gap-[12px] tw-h-full tw-bg-transparent tw-border-[1px] tw-border-[#888888] tw-border-dashed tw-rounded-[7px] tw-items-center tw-justify-center"
                  >
                    <MdAddToPhotos
                      style={{ fontSize: "60px", color: "#888888" }}
                    />
                    <span className="tw-text-[14px] tw-font-semibold tw-text-[#888888]">
                      Select a Photo
                    </span>
                  </div>
                ) : (
                  <div className="tw-w-[calc(100%-20px)] tw-flex tw-flex-col tw-p-[10px] tw-bg-[#f2f2f2] tw-rounded-[5px] tw-gap-[10px]">
                    <button
                      onClick={() => {
                        setrawmedialist(null);
                        setmedialist(null);
                      }}
                      className="btn_remove_preview tw-relative tw--mb-[32px] tw-w-[22px] tw-h-[22px]"
                    >
                      <AiOutlineClose />
                    </button>
                    <CachedImage
                      src={medialist.reference}
                      className="tw-w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="tw-w-[calc(100%-20px)] tw-flex tw-flex-row tw-gap-[5px] tw-pl-[10px] tw-pr-[10px] tw-pt-[5px]">
            <button
              onClick={() => {
                setcurrenttab("privacy");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[#194888]"
            >
              <FaGlobeAsia style={{ fontSize: "20px" }} />
            </button>
            <button
              onClick={() => {
                setcurrenttab("content");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[#1c7DEF]"
            >
              <BsFileEarmarkPost style={{ fontSize: "20px" }} />
            </button>
          </div>
          <div id="div_create_cancel_btns">
            <button
              disabled={isuploadingpost}
              className="btns_create_cancel"
              onClick={() => {
                CreatePostProcess();
              }}
            >
              {isuploadingpost ? (
                <div id="div_conversation_content_loader">
                  <motion.div
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                    id="div_loader_share_conv"
                  >
                    <AiOutlineLoading3Quarters style={{ fontSize: "18px" }} />
                  </motion.div>
                </div>
              ) : (
                "Upload"
              )}
            </button>
            <button
              disabled={isuploadingpost}
              className="btns_create_cancel"
              onClick={() => {
                onclose(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      }
    />
  );
}

export default UploadProfileMedia;
