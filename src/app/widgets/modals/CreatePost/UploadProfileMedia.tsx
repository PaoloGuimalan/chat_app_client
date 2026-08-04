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
import { pickFiles } from "@/reusables/hooks/pickFiles";
import { useDragAndDrop } from "@/reusables/hooks/useDragAndDrop";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/reusables/vars/uploads";
import { FaGlobeAsia } from "react-icons/fa";
import {
  CreatePostRequest,
  UpdateRealmMediaRequest,
  UploadMediaRequest,
} from "@/reusables/hooks/requests";

function UploadProfileMedia({
  realm_id,
  realm_type,
  type,
  getpostprocess,
  onclose,
}: {
  realm_id: string | null;
  realm_type?: string | null;
  type: "profile" | "cover_photo";
  onclose: (state: boolean) => void;
  getpostprocess: () => void;
}) {
  const [isuploadingpost, setisuploadingpost] = useState<boolean>(false);
  const [mainpostcaption, setmainpostcaption] = useState<string>("");

  const [_, setcurrenttab] = useState<string>("content"); //currenttab
  const [medialist, setmedialist] = useState<any>(null);
  const dispatch = useDispatch();

  const addMediaFile = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (!file.type.includes("image")) {
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: { type: "warning", content: "Photos are only allowed" },
        },
      });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: {
            type: "warning",
            content: `Cannot upload files greater than ${MAX_UPLOAD_LABEL}`,
          },
        },
      });
      return;
    }

    if (medialist?.reference) URL.revokeObjectURL(medialist.reference);

    setmedialist({
      id: 1,
      name: file.name,
      reference: URL.createObjectURL(file),
      caption: "",
      referenceMediaType: "image",
      file,
    });
  };

  const sendNonImageFilesProcess = async () => {
    const files = await pickFiles({ accept: "image/*", multiple: false });
    addMediaFile(files);
  };

  const { isDragging: isDraggingMedia, dragHandlers: mediaDragHandlers } =
    useDragAndDrop({
      onFiles: addMediaFile,
      accept: "image/*",
      disabled: isuploadingpost,
    });

  const CreatePostProcess = async () => {
    if (medialist) {
      setisuploadingpost(true);

      try {
        if (realm_id) {
          // Page/Group/Server media: already on the multipart pattern,
          // untouched by this migration.
          const response: any = await UpdateRealmMediaRequest({
            realm_id,
            realm_type: realm_type || "",
            media_type: type,
            image: medialist.file,
          });

          if (response && response.status) {
            URL.revokeObjectURL(medialist.reference);
            onclose(false);
            setisuploadingpost(false);
            dispatch({
              type: SET_MUTATE_ALERTS,
              payload: {
                alerts: { type: "success", content: "Upload successful" },
              },
            });
            getpostprocess();
          } else {
            setisuploadingpost(false);
          }
          return;
        }

        // Personal profile/cover photo: upload the file first (multipart),
        // then create the post via the existing content_type
        // "profile"|"cover_photo" path, which already updates
        // user_account.profile/coverphoto AND creates the feed post - same
        // two-step pattern Create Post uses.
        const uploadResponse: any = await UploadMediaRequest([
          {
            file: medialist.file,
            caption: mainpostcaption,
            referenceMediaType: medialist.referenceMediaType,
          },
        ]);

        const uploaded = uploadResponse.data.result[0];

        const response: any = await CreatePostRequest({
          content: {
            isShared: false,
            references: [
              {
                id: 1,
                name: uploaded.fileName,
                reference: uploaded.fileDetails.data,
                caption: "",
                referenceMediaType: uploaded.fileType,
              },
            ],
            data: mainpostcaption,
          },
          type: {
            fileType: "media", //text, image, video, file
            contentType: type, //text, image, video
          },
          tagging: {
            isTagged: false,
            users: [],
          },
          privacy: {
            status: "public",
            users: [], //userID for filteration depending on status
          }, //public, friends, filtered
          onfeed: "feed",
          realm_id: null,
        });

        if (response.data.status) {
          URL.revokeObjectURL(medialist.reference);
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
              content: "Failed to upload, please try again",
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
          className={`div_modal_container cl-create-post-shell cl-create-post-shell--upload tw-max-h-[600px]`}
        >
          {isuploadingpost && (
            <div
              className={`cl-create-post-loading tw-absolute tw-inset-0 tw-h-full tw-w-full tw-max-h-[520px] tw-flex tw-items-center tw-justify-center`}
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
              <span className="span_modal_header_label tw-font-inter tw-text-[var(--text)]">
                {type === "profile" && "Upload Profile Picture"}
                {type === "cover_photo" && "Upload Cover Photo"}
              </span>
            </div>
          </div>
          <div className="cl-create-post-body scroller tw-w-full tw-items-stretch tw-justify-start">
            <div className="tw-w-full tw-h-full tw-bg-transparent tw-flex tw-flex-col tw-gap-[12px] tw-min-h-0 tw-items-stretch">
              <textarea
                disabled={isuploadingpost}
                value={mainpostcaption}
                onChange={(e) => {
                  setmainpostcaption(e.target.value);
                }}
                className="cl-create-post-textarea tw-font-inter thinscroller tw-font-Inter"
                placeholder="Type your caption"
              />
              <div className="cl-create-post-attachments tw-w-full tw-h-[300px]">
                {medialist === null ? (
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
                    <span className="cl-text-body tw-font-semibold tw-text-[var(--text-2)]">
                      {isDraggingMedia
                        ? "Drop to select"
                        : "Drag & drop a Photo here"}
                    </span>
                    {!isDraggingMedia && (
                      <span className="cl-text-caption tw-font-normal tw-text-[var(--text-2)]">
                        or click to browse
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="cl-create-post-media-card tw-w-full">
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(medialist.reference);
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
          <div className="cl-create-post-toolbar">
            <button
              onClick={() => {
                setcurrenttab("privacy");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--brand-700)]"
            >
              <FaGlobeAsia style={{ fontSize: "20px" }} />
            </button>
            <button
              onClick={() => {
                setcurrenttab("content");
              }}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--brand)]"
            >
              <BsFileEarmarkPost style={{ fontSize: "20px" }} />
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
