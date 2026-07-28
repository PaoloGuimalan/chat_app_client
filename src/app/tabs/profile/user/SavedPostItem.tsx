/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  IPost,
  ISavedPost,
} from "@/reusables/vars/interfaces";
import { Avatar } from "@/reusables/design";
import { useSelector } from "react-redux";
import { useMemo, useState } from "react";
import { GoBookmarkSlashFill } from "react-icons/go";
import { TiArrowLeftThick } from "react-icons/ti";
import {
  GetPostPreviewRequest,
  UnsavePostRequest,
} from "@/reusables/hooks/requests";
import OverlayMessage from "@/app/reusables/catchers/OverlayMessage";
import { motion } from "framer-motion";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PostPreviewModal from "./PostPreviewModal";

function SavedPostItem({ savedPost }: { savedPost: ISavedPost }) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [isSaving, setisSaving] = useState<boolean>(false);
  const [isFetchingPreview, setisFetchingPreview] = useState<boolean>(false);
  const [isRestored, setisRestored] = useState<boolean>(false);
  const [previewPost, setpreviewPost] = useState<IPost | null>(null);
  const [togglePostCarousel, settogglePostCarousel] = useState<boolean>(false);
  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const UnsavePostProcess = () => {
    setisSaving(true);
    UnsavePostRequest(savedPost.post.post_id)
      .then(() => {
        setisSaving(false);
        setisRestored(true);
      })
      .catch((err) => {
        setisSaving(false);
        console.log(err);
      });
  };

  const GetPostPreviewProcess = () => {
    setisFetchingPreview(true);
    GetPostPreviewRequest({
      postID: savedPost.post.post_id,
    })
      .then((response) => {
        if (response) {
          settogglePostCarousel(true);
          setpreviewPost(response);
        } else {
          settogglePostCarousel(false);
        }
        setisFetchingPreview(false);
      })
      .catch((err) => {
        settogglePostCarousel(false);
        setisFetchingPreview(false);
        console.log(err);
      });
  };

  return (
    <div className="tw-w-full tw-relative">
      {isRestored && (
        <OverlayMessage
          message="Post Unsaved"
          className="cl-feed-card__overlay tw-absolute tw-w-full tw-h-full tw-opacity-[0.8] tw-z-[5] tw-flex tw-items-center tw-justify-center tw-rounded-md"
        />
      )}
      {toggleNewPostModal.toggle && (
        <NewPostModal
          toShare={true}
          sharePreviewData={previewPost}
          withImage={toggleNewPostModal.withImage}
          profileInfo={{
            id: authentication.user.userID,
            entityID: authentication.user.entity_id,
            username: authentication.user.username,
          }}
          otherEntityID={null}
          setcreateposttext={() => {}}
          getpostprocess={() => {}}
          onclose={settoggleNewPostModal}
        />
      )}
      {togglePostCarousel && previewPost && (
        <PostPreviewModal
          post={previewPost}
          setPost={setpreviewPost}
          onClose={() => {
            settogglePostCarousel(false);
          }}
          onShare={() => {
            settogglePostCarousel(false);
            settoggleNewPostModal({
              toggle: true,
              withImage: false,
            });
          }}
          onOptionFinish={(type: string) => {
            if (type === "unarchived") {
              setisRestored(true);
            }
          }}
        />
      )}
      <div
        style={{
          borderWidth: "0px",
          boxShadow: "none",
        }}
        className="cl-display-card tw-w-[calc(100%-40px)] tw-p-[20px] tw-pb-[14px] tw-flex tw-flex-row tw-gap-[10px]"
      >
        <Avatar
          id={
            savedPost.post.entity.details?.slug ??
            savedPost.post.entity.details.username
          }
          name={
            savedPost.post.entity.details?.name ??
            `${savedPost.post.entity.details.first_name} ${savedPost.post.entity.details.last_name}`
          }
          src={
            savedPost.post.entity.details.profile
              ? savedPost.post.entity.details.profile &&
                savedPost.post.entity.details.profile !== "N/A"
                ? savedPost.post.entity.details.profile
                : undefined
              : savedPost.post.entity.details.profile &&
                  savedPost.post.entity.details.profile !== "none"
                ? savedPost.post.entity.details.profile
                : undefined
          }
          size={isMobileView ? 85 : 120}
        />
        <div className="tw-flex tw-flex-col tw-flex-1 tw-items-start">
          <div className="tw-flex tw-flex-col tw-gap-[6px] tw-p-[5px] tw-items-start tw-flex-1">
            {savedPost.post.caption.trim() === "" ? (
              <span className="cl-text-body tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                {savedPost.post.entity.details?.name ??
                  savedPost.post.entity.details.first_name}
                {"'s"} Post
              </span>
            ) : (
              <span className="cl-text-body tw-font-semibold tw-font-Inter tw-line-clamp-2 tw-text-left tw-text-[var(--text)]">
                {savedPost.post.caption}
              </span>
            )}
            <div className="tw-flex tw-gap-[5px] tw-items-center">
              <span className="tw-font-Inter cl-text-caption tw-text-[var(--text-2)]">
                {savedPost.post.content_type
                  .replace("_", " ")
                  .split(" ")
                  .map((word) => word[0].toUpperCase() + word.slice(1))
                  .join(" ")}
              </span>
              &bull;
              {savedPost.post.entity.type !== "user" ? (
                <span className="tw-font-Inter cl-text-caption tw-text-[var(--text-2)]">
                  {savedPost.post.entity.details.name}
                </span>
              ) : (
                <span className="tw-font-Inter cl-text-caption tw-text-[var(--text-2)]">
                  {savedPost.post.entity.details.first_name}
                  {savedPost.post.entity.details.middle_name == "N/A"
                    ? ""
                    : ` ${savedPost.post.entity.details.middle_name}`}{" "}
                  {savedPost.post.entity.details.last_name}
                </span>
              )}
            </div>
          </div>
          <div className="tw-pl-[5px] tw-flex tw-gap-[6px]">
            <button
              disabled={isFetchingPreview}
              onClick={GetPostPreviewProcess}
              className="cl-display-card__button cl-display-card__button--muted tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none"
            >
              <TiArrowLeftThick
                size={20}
                style={{ marginLeft: "-1px", marginRight: "0px" }}
              />
              {isFetchingPreview ? (
                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                  className="tw-w-[20px] tw-h-[20px] tw-flex tw-items-center tw-justify-center"
                >
                  <AiOutlineLoading3Quarters style={{ fontSize: "12px" }} />
                </motion.div>
              ) : (
                <span>View</span>
              )}
            </button>
            <button
              disabled={isSaving}
              onClick={UnsavePostProcess}
              className="cl-display-card__button cl-display-card__button--muted tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none"
            >
              <GoBookmarkSlashFill
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Unsave</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavedPostItem;
