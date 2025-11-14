/* eslint-disable react-hooks/exhaustive-deps */
import { commentsliststate } from "@/redux/actions/states";
import {
  GetCommentsRequest,
  SaveCommentRequest,
} from "@/reusables/hooks/requests";
import { IPostComment } from "@/reusables/vars/interfaces";
import { PaginationProp, PostCommentProp } from "@/reusables/vars/props";
import { IoSend } from "react-icons/io5";
import DefaultProfile from "../../../assets/imgs/default.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUniqueItemsOfObjects } from "@/reusables/hooks/validatevariables";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";

function PostComment({ post_id, parent_id }: PostCommentProp) {
  const [comments, setComments] =
    useState<PaginationProp<IPostComment>>(commentsliststate);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  // const [range, setRange] = useState<number>(20);

  const [writeComment, setwriteComment] = useState<string>("");
  const [isCommentSaving, setisCommentSaving] = useState<boolean>(false);

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
            "created_at"
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
            "created_at"
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
        setisCommentSaving(false);
        GetPostCommentOnLoadProcess();
      })
      .catch((err) => {
        setisCommentSaving(false);
        console.log(err);
      });
  };

  return (
    <div className="tw-p-[25px] tw-pt-[5px] tw-w-[calc(100%-50px)] tw-min-h-[250px] tw-flex tw-flex-1 tw-flex-col">
      {!parent_id && (
        <div className="tw-min-h-[60px] tw-flex tw-items-center tw-pb-[10px]">
          <div id="div_img_search_profiles_container_cncts">
            <img src={DefaultProfile} id="img_feed_header" />
          </div>
          <div id="div_input_feed_flex">
            <textarea
              placeholder="Write a comment..."
              id="textarea_feed_box"
              className="tw-font-Inter"
              value={writeComment}
              onChange={(e) => {
                setwriteComment(e.target.value);
              }}
              disabled={isCommentSaving}
            />
          </div>
          <div id="div_confirm_send">
            <button
              onClick={() => {
                SaveCommentProcess();
              }}
              id="btn_image_feed"
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
      )}
      <div className="tw-flex tw-flex-col tw-gap-[10px]">
        {isError ? (
          <span>Error</span>
        ) : comments.results.length === 0 ? (
          isLoaded && <span className="tw-text-[12px]">No Comments yet</span>
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-[15px] tw-items-start">
            {comments.results.map((mp: IPostComment) => {
              return (
                <div
                  key={mp.comment_id}
                  className="tw-flex tw-gap-[10px] tw-w-full"
                >
                  <div id="div_img_comments_container">
                    <div id="div_img_search_profiles_container_cncts">
                      <img
                        src={
                          mp.user.profile == "none"
                            ? DefaultProfile
                            : mp.user.profile
                        }
                        className="img_search_profiles_ntfs"
                      />
                    </div>
                  </div>
                  <div className="tw-w-fit tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-text-left">
                    <span
                      className="tw-break-keep tw-text-[12px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-b tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                      onClick={() => {
                        navigate(`/${mp.user.username}`);
                      }}
                    >
                      {mp.user.first_name}
                      {mp.user.middle_name == "N/A"
                        ? ""
                        : ` ${mp.user.middle_name}`}{" "}
                      {mp.user.last_name}
                    </span>
                    <div
                      style={{ backgroundColor: "rgb(222, 222, 222)" }}
                      className="tw-p-[10px] tw-rounded-[10px] tw-text-left"
                    >
                      <span className="tw-text-[14px]">{mp.text}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {comments.next && isLoaded && (
              <button
                className="tw-text-[12px]"
                onClick={() => {
                  setPage((prev) => prev + 1);
                }}
              >
                See more comments...
              </button>
            )}
          </div>
        )}
        {!isLoaded && <span className="tw-text-[12px]">Loading...</span>}
      </div>
      {parent_id && (
        <div className="tw-min-h-[60px] tw-flex tw-items-center tw-pb-[0px] tw-pt-[10px]">
          <div id="div_img_search_profiles_container_cncts">
            <img src={DefaultProfile} id="img_feed_header" />
          </div>
          <div id="div_input_feed_flex">
            <input
              type="text"
              placeholder="Write a comment..."
              id="input_feed_box"
              // value={createposttext}
              // onFocus={() => {
              //   settoggleNewPostModal({ toggle: true, withImage: false });
              // }}
              // onChange={(e) => {
              //   setcreateposttext(e.target.value);
              // }}
            />
          </div>
          <div id="div_confirm_send">
            <button
              onClick={() => {
                // settoggleNewPostModal({ toggle: true, withImage: true });
              }}
              id="btn_image_feed"
              // disabled={true}
            >
              <IoSend style={{ fontSize: "20px", color: "#3d4551" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostComment;
