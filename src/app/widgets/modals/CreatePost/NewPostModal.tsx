/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import { pickFiles } from "@/reusables/hooks/pickFiles";
import { useDragAndDrop } from "@/reusables/hooks/useDragAndDrop";
import { useLinkPreview } from "@/reusables/hooks/useLinkPreview";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import { useState } from "react";
import { BsFileEarmarkPost, BsPinMapFill } from "react-icons/bs";
import { FaGlobeAsia } from "react-icons/fa";
import { FaUserTag } from "react-icons/fa6";
import { MdAddToPhotos } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import PostMediaPreview from "./PostMediaPreview";
import { CreatePostRequest, UploadMediaRequest } from "@/reusables/hooks/requests";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { BiSolidImageAdd } from "react-icons/bi";
import { PiShareFat } from "react-icons/pi";
import PostItem from "@/app/tabs/profile/user/PostItem";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";

export function NewPostModal({
  toShare,
  sharePreviewData,
  withImage,
  profileInfo,
  otherEntityID,
  setcreateposttext,
  getpostprocess,
  onclose,
}: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [isuploadingpost, setisuploadingpost] = useState<boolean>(false);
  const [iswithImage, setiswithImage] = useState<boolean>(
    toShare ? false : withImage,
  );

  const [mainpostcaption, setmainpostcaption] = useState<string>("");
  const [_, setcurrenttab] = useState<string>("content"); //currenttab
  const [medialist, setmedialist] = useState<any[]>([]);
  const [taggedList, ___] = useState<string[]>([]);
  const dispatch = useDispatch();

  const MAX_MEDIA_SIZE = 25 * 1024 * 1024;

  const addMediaFiles = (files: File[]) => {
    const rejected = files.filter(
      (file) => !file.type.includes("image") && !file.type.includes("video"),
    );
    if (rejected.length > 0) {
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: {
            type: "warning",
            content: "Photos and Videos are only allowed",
          },
        },
      });
    }

    const oversized = files.some((file) => file.size > MAX_MEDIA_SIZE);
    if (oversized) {
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

    files
      .filter(
        (file) =>
          (file.type.includes("image") || file.type.includes("video")) &&
          file.size <= MAX_MEDIA_SIZE,
      )
      .forEach((file) => {
        setmedialist((prev: any) => [
          ...prev,
          {
            id: prev.length + 1,
            name: file.name,
            reference: URL.createObjectURL(file),
            caption: "",
            referenceMediaType: file.type.includes("image")
              ? "image"
              : "video",
            file,
          },
        ]);
      });
  };

  const sendNonImageFilesProcess = async () => {
    const files = await pickFiles({ accept: "image/*,video/*" });
    addMediaFiles(files);
  };

  const { isDragging: isDraggingMedia, dragHandlers: mediaDragHandlers } =
    useDragAndDrop({
      onFiles: addMediaFiles,
      accept: "image/*,video/*",
      disabled: isuploadingpost,
    });

  const linkPreview = useLinkPreview({
    text: mainpostcaption,
    enabled: !toShare && !isuploadingpost,
  });

  const CreatePostProcess = async () => {
    if (toShare || mainpostcaption.trim() !== "" || medialist.length > 0) {
      setisuploadingpost(true);
      const validatedTaggedList =
        authentication.user.entity_id == profileInfo?.entityID
          ? []
          : otherEntityID
            ? [...taggedList]
            : [profileInfo?.entityID, ...taggedList]; //this taggedlist needs to be in username format, not id

      try {
        let uploadedReferences: any[] = [];

        if (!toShare && medialist.length > 0) {
          const uploadResponse: any = await UploadMediaRequest(
            medialist.map((mp) => ({
              file: mp.file,
              caption: mp.caption,
              referenceMediaType: mp.referenceMediaType,
            })),
          );

          uploadedReferences = uploadResponse.data.result.map(
            (mp: any, i: number) => ({
              id: i + 1,
              name: mp.fileName,
              reference: mp.fileDetails.data,
              caption: medialist[i]?.caption || "",
              referenceMediaType: mp.fileType,
            }),
          );
        }

        const response: any = await CreatePostRequest({
          content: {
            isShared: toShare,
            references: toShare
              ? [
                  {
                    id: 1,
                    name: null,
                    reference: sharePreviewData.post_id,
                    caption: "",
                    referenceMediaType: "shared_post",
                  },
                ]
              : uploadedReferences,
            data: mainpostcaption,
          },
          type: {
            fileType: toShare
              ? "shared_post"
              : medialist.length > 0
                ? "media"
                : "text", //text, image, video, file
            contentType: toShare
              ? "shared_post"
              : medialist.length > 0
                ? "media"
                : "text", //text, image, video
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
          otherEntityID: otherEntityID,
        });

        if (response.data.status) {
          medialist.forEach((mp) => URL.revokeObjectURL(mp.reference));
          linkPreview.dismiss();
          onclose(false);
          setisuploadingpost(false);
          setcreateposttext("");
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
        } else {
          setisuploadingpost(false);
        }
      } catch (err: any) {
        console.log(err);
        setisuploadingpost(false);
        dispatch({
          type: SET_MUTATE_ALERTS,
          payload: {
            alerts: {
              type: "warning",
              content: "Failed to create post, please try again",
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
          className={`div_modal_container cl-create-post-shell ${
            toShare
              ? "cl-create-post-shell--share"
              : iswithImage
                ? "cl-create-post-shell--media"
                : ""
          } ${
            toShare
              ? "tw-max-h-[600px]"
              : iswithImage
                ? "tw-max-h-[600px]"
                : "tw-max-h-[250px]"
          }`}
        >
          {isuploadingpost && !toShare && (
            <div
              className={`cl-create-post-loading tw-absolute tw-inset-0 tw-h-full tw-w-full ${
                toShare
                  ? "tw-max-h-[600px]"
                  : iswithImage
                    ? "tw-max-h-[520px]"
                    : "tw-max-h-[220px]"
              } tw-flex tw-items-center tw-justify-center`}
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
              {toShare ? (
                <PiShareFat style={{ fontSize: "22px" }} />
              ) : (
                <BsFileEarmarkPost style={{ fontSize: "20px" }} />
              )}
              <span className="span_modal_header_label tw-font-inter tw-text-[var(--text)]">
                {toShare ? "Share Post" : "Create a Post"}
              </span>
            </div>
          </div>
          <div className="cl-create-post-body scroller tw-w-full tw-items-stretch tw-justify-start">
            <div className="tw-w-full tw-h-full tw-bg-transparent tw-flex tw-flex-col tw-gap-[12px] tw-min-h-0 tw-items-stretch">
              <textarea
                disabled={isuploadingpost}
                value={mainpostcaption}
                onChange={(e) => {
                  setcreateposttext(e.target.value);
                  setmainpostcaption(e.target.value);
                }}
                className="cl-create-post-textarea tw-font-inter thinscroller tw-font-Inter"
                placeholder="Type your caption"
              />
              {!toShare && linkPreview.status === "ok" && linkPreview.preview && (
                <LinkPreviewCard
                  preview={linkPreview.preview}
                  variant="composer"
                  onRemove={linkPreview.dismiss}
                />
              )}
              {iswithImage && (
                <div className="cl-create-post-attachments">
                  {medialist.length > 0 ? (
                    <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px]">
                      {medialist
                        .sort(function (a, b) {
                          return a.id - b.id || a.name.localeCompare(b.name);
                        })
                        .map((mp: any) => {
                          return (
                            <PostMediaPreview
                              key={mp.id}
                              mp={mp}
                              setmedialist={setmedialist}
                            />
                          );
                        })}
                      <div
                        onClick={() => {
                          sendNonImageFilesProcess();
                        }}
                        {...mediaDragHandlers}
                        className={`cl-create-post-dropzone tw-w-full tw-select-none tw-cursor-pointer tw-flex tw-flex-1 tw-flex-row tw-gap-[12px] tw-min-h-[70px] tw-border-dashed tw-items-center tw-justify-center ${
                          isDraggingMedia ? "tw-border-[var(--brand)]" : ""
                        }`}
                      >
                        <MdAddToPhotos
                          style={{ fontSize: "20px", color: "var(--text-2)" }}
                        />
                        <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text-2)]">
                          {isDraggingMedia
                            ? "Drop to attach"
                            : "Drag & drop a Photo or Video, or click to browse"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        sendNonImageFilesProcess();
                      }}
                      {...mediaDragHandlers}
                      className={`cl-create-post-dropzone cl-create-post-dropzone--stacked tw-w-full tw-select-none tw-cursor-pointer tw-flex tw-flex-1 tw-flex-col tw-gap-[12px] tw-h-full tw-border-dashed tw-items-center tw-justify-center ${
                        isDraggingMedia ? "tw-border-[var(--brand)]" : ""
                      }`}
                    >
                      <MdAddToPhotos
                        style={{ fontSize: "60px", color: "var(--text-2)" }}
                      />
                      <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text-2)]">
                        {isDraggingMedia
                          ? "Drop to attach"
                          : "Drag & drop photos or videos here"}
                      </span>
                      {!isDraggingMedia && (
                        <span className="tw-text-[12px] tw-font-normal tw-text-[var(--text-2)]">
                          or click to browse
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {toShare && (
                <div className="cl-create-post-preview tw-w-full tw-max-h-[360px] tw-overflow-auto">
                  <PostItem isSharePreview={true} mp={sharePreviewData} />
                </div>
              )}
            </div>
          </div>
          <div className="cl-create-post-toolbar">
            <button
              onClick={() => {
                setcurrenttab("privacy");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--brand-700)]"
            >
              <FaGlobeAsia style={{ fontSize: "20px" }} />
            </button>
            {!toShare && (
              <button
                onClick={() => {
                  setiswithImage(true);
                }}
                className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--brand)]"
              >
                <BiSolidImageAdd style={{ fontSize: "24px" }} />
              </button>
            )}
            <button
              onClick={() => {
                setcurrenttab("content");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--brand)]"
            >
              <BsFileEarmarkPost style={{ fontSize: "20px" }} />
            </button>
            <button
              onClick={() => {
                setcurrenttab("tagging");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--green)]"
            >
              <FaUserTag style={{ fontSize: "20px" }} />
            </button>
            <button
              onClick={() => {
                setcurrenttab("mapfeedstatus");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--pink)]"
            >
              <BsPinMapFill style={{ fontSize: "18px" }} />
            </button>
          </div>
          <div id="div_create_cancel_btns" className="cl-create-post-actions">
            <button
              disabled={isuploadingpost}
              className="btns_create_cancel"
              onClick={() => {
                CreatePostProcess();
              }}
            >
              {toShare ? (
                isuploadingpost ? (
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
                  "Share"
                )
              ) : (
                "Create"
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
