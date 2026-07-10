/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { commentsliststate } from "@/redux/actions/states";
import {
  GetCommentsRequest,
  SaveCommentRequest,
} from "@/reusables/hooks/requests";
import {
  AuthenticationInterface,
  IPostComment,
} from "@/reusables/vars/interfaces";
import { PaginationProp, PostCommentProp } from "@/reusables/vars/props";
import { IoSend } from "react-icons/io5";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUniqueItemsOfObjects } from "@/reusables/hooks/validatevariables";
import { getActiveAvatar, timeSince } from "@/reusables/hooks/reusable";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { FaFileAlt } from "react-icons/fa";
import PostCommentLoader from "@/app/reusables/loaders/PostCommentLoader";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useSelector } from "react-redux";
import { Avatar } from "@/reusables/design";
import { useLinkPreview } from "@/reusables/hooks/useLinkPreview";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";

function PostComment({ post_id, parent_id }: PostCommentProp) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const activeAvatar = getActiveAvatar(authentication);

  const [comments, setComments] =
    useState<PaginationProp<IPostComment>>(commentsliststate);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  // const [range, setRange] = useState<number>(20);

  const [writeComment, setwriteComment] = useState<string>("");
  const [isCommentSaving, setisCommentSaving] = useState<boolean>(false);

  const linkPreview = useLinkPreview({
    text: writeComment,
    enabled: !isCommentSaving,
  });

  const navigate = useNavigate();

  useEffect(() => {
    GetPostCommentProcess(page, 20);
  }, [post_id, parent_id, page]);

  const GetPostCommentProcess = (to_page: number, to_range: number) => {
    setIsLoaded(false);
    setIsError(false);
    GetCommentsRequest(post_id, parent_id, to_page, to_range)
      .then((response: PaginationProp<IPostComment>) => {
        setComments((prev: PaginationProp<IPostComment>) => ({
          ...response,
          results: getUniqueItemsOfObjects(
            [...prev.results, ...response.results],
            "comment_id",
            "created_at",
          ),
        }));
        setIsLoaded(true);
        setIsError(false);
      })
      .catch((err) => {
        setIsLoaded(true);
        setIsError(true);
        console.log(err);
      });
  };

  const GetPostCommentOnLoadProcess = () => {
    GetCommentsRequest(post_id, parent_id, 1, 20)
      .then((response: PaginationProp<IPostComment>) => {
        setComments((prev: PaginationProp<IPostComment>) => ({
          ...prev,
          results: getUniqueItemsOfObjects(
            [...prev.results, ...response.results],
            "comment_id",
            "created_at",
          ),
        }));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const SaveCommentProcess = () => {
    setisCommentSaving(true);
    SaveCommentRequest(post_id, parent_id, writeComment, null)
      .then(() => {
        setwriteComment("");
        linkPreview.dismiss();
        setisCommentSaving(false);
        GetPostCommentOnLoadProcess();
      })
      .catch((err) => {
        setisCommentSaving(false);
        console.log(err);
      });
  };

  return (
    <div className="cl-comment-section tw-p-[25px] tw-pt-[5px] tw-w-full tw-min-h-[250px] tw-flex tw-flex-1 tw-flex-col tw-gap-[16px]">
      {authentication.auth && !parent_id && (
        <div className="tw-w-full tw-flex tw-flex-col tw-gap-[8px] tw-pb-[10px]">
          <div className="cl-comment-section__composer tw-min-h-[60px] tw-flex tw-items-center tw-gap-[12px] tw-w-full">
            <Avatar
              id={authentication.user.userID}
              name={activeAvatar.name}
              src={activeAvatar.src}
              size={48}
            />
            <div
              id="div_input_feed_flex"
              className="cl-comment-section__field-shell"
            >
              <textarea
                placeholder="Write a comment..."
                id="textarea_feed_box"
                className="cl-comment-section__field tw-font-Inter"
                value={writeComment}
                onChange={(e) => {
                  setwriteComment(e.target.value);
                }}
                disabled={isCommentSaving}
              />
            </div>
            <div id="div_confirm_send" className="cl-comment-section__send-shell">
              <button
                onClick={() => {
                  SaveCommentProcess();
                }}
                id="btn_image_feed"
                className="cl-comment-section__send"
                disabled={isCommentSaving}
              >
                {isCommentSaving ? (
                  <div id="div_conversation_content_loader">
                    <motion.div
                      animate={{
                        rotate: -360,
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      // id="div_loader_share_conv"
                      className="tw-w-[20px] tw-h-[20px] tw-flex tw-items-center tw-justify-center"
                    >
                      <AiOutlineLoading3Quarters style={{ fontSize: "18px" }} />
                    </motion.div>
                  </div>
                ) : (
                  <IoSend style={{ fontSize: "20px", color: "#3d4551" }} />
                )}
              </button>
            </div>
          </div>
          {linkPreview.status === "ok" && linkPreview.preview && (
            <LinkPreviewCard
              preview={linkPreview.preview}
              variant="composer"
              onRemove={linkPreview.dismiss}
            />
          )}
        </div>
      )}
      <div className="cl-comment-section__list tw-flex tw-flex-col tw-gap-[14px] tw-w-full">
        {isError ? (
          <span>Error</span>
        ) : comments.results.length === 0 ? (
          isLoaded && (
            <div className="cl-comment-section__empty tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[40px] tw-text-[var(--text-2)]">
              <FaFileAlt style={{ fontSize: "40px", color: "var(--text-2)" }} />
              <div className="tw-flex tw-flex-col tw-gap-[0px] tw-text-[var(--text-2)]">
                <span className="tw-font-semibold tw-text-[12px] tw-text-[var(--text)]">
                  No Comments yet
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="cl-comment-section__rows tw-flex tw-flex-col tw-gap-[14px] tw-items-start tw-w-full">
            {comments.results.map((mp: IPostComment) => {
              return (
                <div
                  key={mp.comment_id}
                  className="cl-comment-section__row tw-flex tw-gap-[12px] tw-w-full tw-items-start"
                >
                  <Avatar
                    id={mp.entity.details.id}
                    name={`${mp.entity.details.first_name} ${mp.entity.details.last_name}`}
                    src={
                      mp.entity.details.profile == "none"
                        ? undefined
                        : mp.entity.details.profile
                    }
                    size={46}
                  />
                  <div className="tw-flex tw-flex-col tw-items-start tw-gap-[6px] tw-text-left tw-flex-1 tw-min-w-0">
                    <div className="cl-comment-section__bubble tw-w-full tw-rounded-[14px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-p-[12px] tw-text-left tw-shadow-sm">
                      <div className="tw-w-full tw-flex tw-items-start tw-justify-between tw-gap-[10px]">
                        <span
                          className="cl-comment-section__name tw-break-keep tw-text-[12px] tw-w-fit tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[var(--text-2)] tw-text-[var(--text)]"
                          onClick={() => {
                            if (mp.entity.type === "user") {
                              navigate(`/${mp.entity.details.username}`);
                              return;
                            }

                            navigate(`/${mp.entity.details.slug}`);
                          }}
                        >
                          {mp.entity.type === "user" ? (
                            <div className="tw-flex tw-items-center tw-gap-[4px] tw-flex-wrap tw-text-left">
                              <span>
                                {mp.entity.details.first_name}
                                {mp.entity.details.middle_name == "N/A"
                                  ? ""
                                  : ` ${mp.entity.details.middle_name}`}{" "}
                                {mp.entity.details.last_name}
                              </span>
                              {mp.entity.details.is_badged && (
                                <RiVerifiedBadgeFill
                                  size={16}
                                  color="#1c7def"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="tw-flex tw-items-center tw-gap-[4px] tw-flex-wrap tw-text-left">
                              <span>{mp.entity.details.name}</span>
                              {mp.entity.details.is_verified && (
                                <RiVerifiedBadgeFill
                                  size={16}
                                  color="#1c7def"
                                />
                              )}
                            </div>
                          )}
                        </span>
                        <span className="tw-text-[11px] tw-text-[var(--text-3)] tw-flex-none tw-whitespace-nowrap tw-text-right">
                          {timeSince(mp.created_at)}
                        </span>
                      </div>
                      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[4px] tw-mt-[4px]">
                        <span className="cl-comment-section__text tw-text-[14px] tw-leading-[1.5] tw-break-words tw-text-[var(--text)]">
                          {mp.text}
                        </span>
                        {mp.link_preview && (
                          <LinkPreviewCard
                            preview={mp.link_preview}
                            variant="display"
                          />
                        )}
                      </div>
                      {/* <span className="tw-text-[14px]">{mp.text}</span> */}
                    </div>
                  </div>
                </div>
              );
            })}
            {comments.next && isLoaded && (
              <button
                className="cl-comment-section__more tw-text-[12px] tw-text-[var(--brand)] hover:tw-text-[var(--brand-hover)]"
                onClick={() => {
                  setPage((prev) => prev + 1);
                }}
              >
                See more comments...
              </button>
            )}
          </div>
        )}
        {!isLoaded && <PostCommentLoader />}
      </div>
      {parent_id && (
        <div className="cl-comment-section__composer cl-comment-section__composer--reply tw-min-h-[60px] tw-flex tw-items-center tw-gap-[12px] tw-pb-[0px] tw-pt-[10px] tw-w-full">
          <Avatar
            id={authentication.user.userID}
            name={activeAvatar.name}
            src={activeAvatar.src}
            size={48}
          />
          <div
            id="div_input_feed_flex"
            className="cl-comment-section__field-shell"
          >
            <input
              type="text"
              placeholder="Write a comment..."
              id="input_feed_box"
              className="cl-comment-section__field"
              // value={createposttext}
              // onFocus={() => {
              //   settoggleNewPostModal({ toggle: true, withImage: false });
              // }}
              // onChange={(e) => {
              //   setcreateposttext(e.target.value);
              // }}
            />
          </div>
          <div id="div_confirm_send" className="cl-comment-section__send-shell">
            <button
              onClick={() => {
                // settoggleNewPostModal({ toggle: true, withImage: true });
              }}
              id="btn_image_feed"
              className="cl-comment-section__send"
              // disabled={true}
            >
              <IoSend style={{ fontSize: "20px", color: "var(--text-2)" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostComment;
