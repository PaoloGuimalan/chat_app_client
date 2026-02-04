/* eslint-disable @typescript-eslint/no-explicit-any */
// import React from 'react'
import { useEffect, useMemo, useRef, useState } from "react";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { BiLike } from "react-icons/bi";
import { LiaComment } from "react-icons/lia";
import { PiShareFat } from "react-icons/pi";
import { BsPinMap } from "react-icons/bs";
import {
  AuthenticationInterface,
  Emoji,
  // IActivityCounts,
  IPost,
  IReference,
  ITagging,
} from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import Modal from "@/app/reusables/Modal";
import { IoMdClose } from "react-icons/io";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import LoadedPostItem from "./LoadedPostItem";
import { motion } from "framer-motion";
import PostEmojis from "@/app/reusables/PostEmojis";
import { GetReactionTotalRequest } from "@/reusables/hooks/requests";
import PostComment from "@/app/widgets/items/PostComment";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { timeSince } from "@/reusables/hooks/reusable";

function PostItem({
  isSharePreview,
  mp,
}: {
  isSharePreview: boolean;
  mp: IPost;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist);
  const navigate = useNavigate();

  const [togglePostCarousel, settogglePostCarousel] = useState<boolean>(false);
  const [minimizedCaption, setminimizedCaption] = useState<boolean | null>(
    null,
  );
  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });
  const [toggleEmojis, settoggleEmojis] = useState<boolean>(false);
  const [emojiLoading, setemojiLoading] = useState<boolean>(false);
  const [postState, setpostState] = useState<IPost>(mp);

  const timeDetail = timeSince(new Date(postState.date_posted));
  const dateposted = timeDetail;
  const textRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);

  const postOwnerUserID = postState.user.username;

  const toggleActivityCounts = useMemo(() => {
    const reactionsCount = postState.preview.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const activityCount =
      postState.score.comments_count + postState.score.shares_count;

    return reactionsCount + activityCount;
  }, [postState]);

  const total_reactions = useMemo(
    () => postState.preview.reduce((sum, item) => sum + item.count, 0),
    [postState],
  );

  const commentsCount = useMemo(
    () => postState.score.comments_count,
    [postState],
  );
  const shareCount = useMemo(() => postState.score.shares_count, [postState]);

  useEffect(() => {
    if (postState) {
      if (postState.caption.length >= 600) {
        setminimizedCaption(true);
      } else {
        setminimizedCaption(false);
      }
    }
  }, [postState]);

  const onProcessEmojiSelection = (emoji_id: string) => {
    settoggleEmojis(false);
    setemojiLoading(true);
    setpostState((prev: IPost) => ({
      ...prev,
      user_reaction: emoji_id,
    }));
  };

  const onSuccessEmojiSelection = (isReactionProcessed: boolean) => {
    setemojiLoading(false);

    if (!isReactionProcessed) {
      setpostState(mp);

      return;
    }

    GetReactionTotalRequest(postState.post_id)
      .then((response) => {
        setpostState((prev: IPost) => ({
          ...prev,
          preview: response,
        }));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    minimizedCaption !== null && (
      <div
        style={{
          borderWidth: isSharePreview ? "1px" : "0px",
        }}
        className=" tw-bg-white tw-border-solid tw-border-[#d2d2d2] tw-rounded-[7px] tw-w-[calc(100%-40px)] tw-p-[20px] tw-pb-[7px] tw-flex tw-flex-col tw-gap-[10px]"
      >
        <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
          {postState.user.profile !== "none" ? (
            <div id="img_default_profile_container">
              <CachedImage
                src={postState.user.profile}
                id="img_actual_profile"
              />
            </div>
          ) : (
            <div id="div_img_feed_post_container">
              <CachedImage src={DefaultProfile} id="img_feed_header" />
            </div>
          )}
          <div className="tw-flex tw-flex-col tw-items-start tw-gap-[2px]">
            <div className="tw-text-left">
              <span
                className="tw-break-keep tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                onClick={() => {
                  navigate(`/${postState.user.username}`);
                }}
              >
                {postState.user.first_name}
                {postState.user.middle_name == "N/A"
                  ? ""
                  : ` ${postState.user.middle_name}`}{" "}
                {postState.user.last_name}
              </span>
              &nbsp;
              {postState.content_type === "profile" && (
                <span className="tw-text-[14px]">changed profile picture</span>
              )}
              {postState.content_type === "cover_photo" && (
                <span className="tw-text-[14px]">changed cover photo</span>
              )}
              &nbsp;
              {postState.tagging.length > 0 && (
                <span className="tw-text-[14px]">is with</span>
              )}
              &nbsp;
              {postState.tagging.length > 0 &&
                postState.tagging.map((mptg: ITagging, i: number) => {
                  return (
                    <span
                      className="tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                      onClick={() => {
                        navigate(`/${mptg.user.username}`);
                      }}
                      key={i}
                    >
                      {mptg.user.first_name}
                      {mptg.user.middle_name == "N/A"
                        ? ""
                        : ` ${mptg.user.middle_name}`}{" "}
                      {mptg.user.last_name}
                    </span>
                  );
                })}
            </div>
            <span className="tw-text-[12px]">{dateposted}</span>
          </div>
        </div>
        <div
          className={`tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[10px] tw-min-h-[35px] tw-justify-center`}
        >
          <div
            ref={textContainerRef}
            className={`tw-w-full tw-flex tw-justify-center ${
              minimizedCaption ? "tw-max-h-[120px]" : "tw-max-h-none"
            } tw-overflow-y-hidden`}
          >
            <span ref={textRef} className={`tw-text-[14px] tw-text-left c1`}>
              {postState.caption}
            </span>
          </div>
          {minimizedCaption && (
            <button
              onClick={() => {
                setminimizedCaption(false);
              }}
              className={`tw-text-[12px] tw-text-left tw-bg-transparent tw-text-gray-700 tw-p-[5px] tw-border-none tw-cursor-pointer hover:tw-bg-gray-400 tw-rounded-[4px]`}
            >
              Expand
            </button>
          )}
          {!minimizedCaption && postState.caption.length >= 600 && (
            <button
              onClick={() => {
                setminimizedCaption(true);
              }}
              className={`tw-text-[12px] tw-text-left tw-bg-transparent tw-text-gray-700 tw-p-[5px] tw-border-none tw-cursor-pointer hover:tw-bg-gray-400 tw-rounded-[4px]`}
            >
              See less
            </button>
          )}
          {togglePostCarousel && (
            <Modal
              component={
                <div
                  style={{
                    maxWidth:
                      postState.references.length > 0
                        ? postState.is_shared
                          ? window.innerWidth >= 842
                            ? "600px"
                            : "none"
                          : "1400px"
                        : window.innerWidth >= 842
                          ? "600px"
                          : "none",
                  }}
                  className={`tw-bg-white custom:tw-rounded-[7px] tw-rounded-[0px] custom:tw-w-[95%] custom:tw-h-[95%] tw-w-[100%] tw-h-[100%] custom:tw-max-h-[800px] tw-max-h-full tw-flex tw-flex-row tw-flex-wrap ${
                    postState.is_shared || postState.references.length === 0
                      ? ""
                      : "custom:tw-overflow-hidden"
                  } tw-overflow-auto ${
                    window.innerWidth >= 842 ? "x-scroll" : "t-scroll"
                  }`}
                >
                  {/* <div className="tw-w-[calc(100%-22px)] tw-p-[10px] tw-pl-[12px] tw-pr-[10px] tw-pt-[10px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
                        <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1 tw-font-Inter">
                          Post
                        </span>
                        <button
                          onClick={() => {
                            settogglePostCarousel(false);
                          }}
                          className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
                        >
                          <IoMdClose style={{ fontSize: "17px" }} />
                        </button>
                      </div> */}
                  {!postState.is_shared && (
                    <Carousel
                      className="tw-bg-black tw-w-full tw-h-full tw-flex-1 tw-min-w-[350px]"
                      showIndicators={false}
                      showThumbs={false}
                    >
                      {postState.references.map((mpr: IReference) => {
                        if (mpr.reference_media_type.includes("image")) {
                          return (
                            <div
                              key={mpr.reference_id}
                              className="tw-h-full tw-bg-black"
                            >
                              <CachedImage
                                src={mpr.reference}
                                className="tw-w-full tw-h-full tw-object-contain"
                              />
                            </div>
                          );
                        } else if (mpr.reference_media_type.includes("video")) {
                          return (
                            <div
                              key={mpr.reference_id}
                              className="tw-h-full tw-max-h-full tw-bg-black"
                            >
                              <video
                                controls
                                src={mpr.reference}
                                className="tw-w-full tw-h-full"
                              />
                            </div>
                          );
                        } else {
                          return <></>;
                        }
                      })}
                    </Carousel>
                  )}
                  <div
                    className={`tw-flex tw-flex-1 tw-max-w-full ${
                      postState.references.length > 0
                        ? postState.is_shared
                          ? "custom:tw-max-w-full"
                          : "custom:tw-max-w-[400px]"
                        : "custom:tw-max-w-full"
                    } tw-min-w-[350px] tw-bg-white tw-flex-col tw-pb-[10px] ${
                      postState.is_shared || postState.references.length === 0
                        ? ""
                        : "custom:tw-h-full"
                    }`}
                  >
                    <div className="tw-w-[calc(100%-50px)] tw-p-[25px] tw-flex tw-justify-between">
                      <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
                        {postState.user.profile !== "none" ? (
                          <div id="img_default_profile_container">
                            <CachedImage
                              src={postState.user.profile}
                              id="img_actual_profile"
                            />
                          </div>
                        ) : (
                          <div id="div_img_feed_post_container">
                            <CachedImage
                              src={DefaultProfile}
                              id="img_feed_header"
                            />
                          </div>
                        )}
                        <div className="tw-flex tw-flex-col tw-items-start tw-gap-[2px]">
                          <div className="tw-text-left">
                            <span
                              className="tw-break-keep tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                              onClick={() => {
                                navigate(`/${postState.user.username}`);
                              }}
                            >
                              {postState.user.first_name}
                              {postState.user.middle_name == "N/A"
                                ? ""
                                : ` ${postState.user.middle_name}`}{" "}
                              {postState.user.last_name}
                            </span>
                            &nbsp;
                            {postState.tagging.length > 0 && (
                              <span className="tw-text-[14px]">is with</span>
                            )}
                            &nbsp;
                            {postState.tagging.length > 0 &&
                              postState.tagging.map(
                                (mptg: ITagging, i: number) => {
                                  return (
                                    <span
                                      className="tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                                      onClick={() => {
                                        navigate(`/${mptg.user.username}`);
                                      }}
                                      key={i}
                                    >
                                      {mptg.user.first_name}
                                      {mptg.user.middle_name == "N/A"
                                        ? ""
                                        : ` ${mptg.user.middle_name}`}{" "}
                                      {mptg.user.last_name}
                                    </span>
                                  );
                                },
                              )}
                          </div>
                          <span className="tw-text-[12px]">{dateposted}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          settogglePostCarousel(false);
                        }}
                        className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
                      >
                        <IoMdClose style={{ fontSize: "17px" }} />
                      </button>
                    </div>
                    <div
                      className={`tw-w-[calc(100%-50px)] tw-pl-[25px] tw-pr-[25px] tw-flex tw-flex-col tw-items-center tw-gap-[10px] tw-min-h-[35px] tw-justify-center`}
                    >
                      <div
                        ref={textContainerRef}
                        className={`tw-w-full tw-flex tw-justify-center ${
                          minimizedCaption
                            ? "tw-max-h-[120px]"
                            : "tw-max-h-none"
                        } tw-overflow-y-hidden`}
                      >
                        <span
                          ref={textRef}
                          className={`tw-text-[14px] tw-text-left c1`}
                        >
                          {postState.caption}
                        </span>
                      </div>
                      {minimizedCaption && (
                        <button
                          onClick={() => {
                            setminimizedCaption(false);
                          }}
                          className={`tw-text-[12px] tw-text-left tw-bg-transparent tw-text-gray-700 tw-p-[5px] tw-border-none tw-cursor-pointer hover:tw-bg-gray-400 tw-rounded-[4px]`}
                        >
                          Expand
                        </button>
                      )}
                      {!minimizedCaption && postState.caption.length >= 600 && (
                        <button
                          onClick={() => {
                            setminimizedCaption(true);
                          }}
                          className={`tw-text-[12px] tw-text-left tw-bg-transparent tw-text-gray-700 tw-p-[5px] tw-border-none tw-cursor-pointer hover:tw-bg-gray-400 tw-rounded-[4px]`}
                        >
                          See less
                        </button>
                      )}
                      {postState.is_shared &&
                        postState.references.map((mpu: any, i: number) => {
                          return (
                            <LoadedPostItem key={i} postID={mpu.reference} />
                          );
                        })}
                    </div>
                    <div className="tw-w-[calc(100%-50px)] tw-pl-[25px] tw-pr-[25px] tw-mt-[10px] tw-pb-[5px]">
                      <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[0px] tw-justify-center">
                        <motion.div
                          initial={{
                            height: toggleActivityCounts > 0 ? "auto" : "0px",
                            paddingTop:
                              toggleActivityCounts > 0 ? "5px" : "0px",
                          }}
                          animate={{
                            height: toggleActivityCounts > 0 ? "auto" : "0px",
                            paddingTop:
                              toggleActivityCounts > 0 ? "5px" : "0px",
                          }}
                          className="tw-w-full tw-flex tw-flex-row tw-gap-[15px] tw-items-center tw-overflow-hidden"
                        >
                          <div className="tw-flex tw-flex-row">
                            {postState.preview
                              .filter((flt) => flt.count > 0)
                              .map((mp, i) => {
                                if (emojilist.length > 0) {
                                  return (
                                    <span key={i} className="-tw-mr-[10px]">
                                      {
                                        emojilist.filter(
                                          (flt) => flt.emoji_id === mp.emoji,
                                        )[0].emoji_content
                                      }
                                    </span>
                                  );
                                }
                              })}
                          </div>
                          <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
                            {total_reactions > 0 && (
                              <span className="tw-text-[12px] tw-text-gray-800">
                                {total_reactions}{" "}
                                {total_reactions === 1
                                  ? " reaction"
                                  : " reactions"}
                              </span>
                            )}
                            <div className="tw-flex tw-gap-[10px] tw-items-center">
                              {commentsCount > 0 && (
                                <span className="tw-text-[12px] tw-text-gray-800">
                                  {commentsCount}{" "}
                                  {commentsCount === 1
                                    ? " comment"
                                    : " comments"}
                                </span>
                              )}
                              {shareCount > 0 && (
                                <span className="tw-text-[12px] tw-text-gray-800">
                                  {shareCount}{" "}
                                  {shareCount === 1 ? " share" : " shares"}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                        <hr className="tw-w-full tw-text-[#666666] tw-border-white tw-opacity-[0.4] tw-mb-[5px] tw-z-[0]" />
                        <div className="tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center">
                          <button
                            onMouseEnter={() => {
                              settoggleEmojis(true);
                            }}
                            onMouseLeave={() => {
                              settoggleEmojis(false);
                            }}
                            disabled={emojiLoading}
                            className="tw-relative tw-inline-block tw-bg-transparent tw-flex-col tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]"
                          >
                            <motion.div
                              className="tw-absolute tw-min-h-[50px] tw-h-full tw-rounded-full tw-bg-white tw-shadow-lg tw-bottom-[calc(100%+15px)]"
                              initial={{
                                scale: 0,
                              }}
                              animate={{
                                scale: toggleEmojis ? 1 : 0,
                              }}
                            >
                              <PostEmojis
                                post_id={postState.post_id}
                                reaction={postState.user_reaction}
                                onProcessEmojiSelection={
                                  onProcessEmojiSelection
                                }
                                onSuccessEmojiSelection={
                                  onSuccessEmojiSelection
                                }
                              />
                            </motion.div>
                            {postState.user_reaction ? (
                              <div className="tw-text-[25px] tw-flex-1 tw-justify-center tw-items-center -tw-mt-[6px]">
                                {emojilist.length > 0 &&
                                  (emojilist.filter(
                                    (flt: Emoji) =>
                                      flt.emoji_id === postState.user_reaction,
                                  )[0].emoji_content ??
                                    "...")}
                              </div>
                            ) : (
                              <BiLike
                                style={{
                                  fontSize: "25px",
                                  color: "#666666",
                                }}
                              />
                            )}
                          </button>
                          <button className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]">
                            <LiaComment
                              style={{ fontSize: "25px", color: "#666666" }}
                            />
                          </button>
                          <button
                            onClick={() => {
                              settoggleNewPostModal({
                                toggle: true,
                                withImage: false,
                              });
                            }}
                            className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]"
                          >
                            <PiShareFat
                              style={{ fontSize: "25px", color: "#666666" }}
                            />
                          </button>
                          {postOwnerUserID === authentication.user.userID && (
                            <button className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]">
                              <BsPinMap
                                style={{
                                  fontSize: "22px",
                                  color: "#666666",
                                }}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={
                        postState.is_shared
                          ? "custom:tw-overflow-y-hidden"
                          : "custom:tw-overflow-y-auto"
                      }
                    >
                      <PostComment
                        post_id={postState.post_id}
                        parent_id={null}
                      />
                    </div>
                  </div>
                  {/* <div className="tw-h-[15px]" /> */}
                </div>
              }
            />
          )}
          {postState.references.length > 0 && !postState.is_shared && (
            <div className="tw-bg-white tw-w-[calc(100%+40px)] tw-flex tw-flex-row tw-flex-wrap tw-gap-[2px]">
              {" "}
              {/**tw-bg-black*/}
              {postState.references.map((mpu: IReference, i: number) => {
                if (i <= 3) {
                  if (mpu.reference_media_type.includes("image")) {
                    if (postState.references.length === 1) {
                      return (
                        <div
                          onClick={() => {
                            if (!isSharePreview) {
                              settogglePostCarousel(true);
                            }
                          }}
                          key={mpu.reference_id}
                          className="tw-flex tw-max-h-[500px] tw-flex-1 tw-bg-black tw-min-w-[100px] lg:tw-min-w-[200px]"
                        >
                          <CachedImage
                            src={mpu.reference}
                            className="tw-w-full tw-h-full tw-object-cover"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div
                          onClick={() => {
                            if (!isSharePreview) {
                              settogglePostCarousel(true);
                            }
                          }}
                          key={mpu.reference_id}
                          className="tw-flex tw-h-[400px] tw-flex-1 tw-bg-black tw-min-w-[100px] lg:tw-min-w-[200px]"
                        >
                          <CachedImage
                            src={mpu.reference}
                            className="tw-w-full tw-h-full tw-object-cover"
                          />
                        </div>
                      );
                    }
                  } else if (mpu.reference_media_type.includes("video")) {
                    return (
                      <div
                        key={mpu.reference_id}
                        className="tw-flex tw-h-[400px] tw-flex-1 tw-bg-black tw-min-w-[100px] lg:tw-min-w-[200px]"
                      >
                        <video
                          controls
                          src={mpu.reference}
                          className="tw-w-full tw-h-full tw-object-cover"
                        />
                      </div>
                    );
                  }
                }
              })}
              {postState.references.length > 3 && (
                <div
                  onClick={() => {
                    settogglePostCarousel(true);
                  }}
                  className="tw-flex tw-max-h-[400px] tw-flex-1 tw-bg-black tw-min-w-[200px]"
                >
                  <div className="tw-cursor-pointer tw-select-none tw-relative tw-h-full tw-w-full tw-bg-black tw-opacity-[0.8] tw-top-0 tw-left-0 tw-z-[1] tw-flex tw-items-center tw-justify-center">
                    <div>
                      <span className="tw-text-white tw-font-Inter tw-font-semibold tw-text-[40px]">
                        + {postState.references.length - 4}
                      </span>
                    </div>
                  </div>
                  {postState.references[4].reference_media_type === "image" ? (
                    <CachedImage
                      src={postState.references[4].reference}
                      className="tw-w-full tw-h-full tw--ml-[100%] tw-object-cover"
                    />
                  ) : (
                    <video
                      src={postState.references[4].reference}
                      className="tw-w-full tw-h-full tw--ml-[100%]"
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {postState.is_shared &&
            postState.references.map((mpu: any, i: number) => {
              return <LoadedPostItem key={i} postID={mpu.reference} />;
            })}
          {toggleNewPostModal.toggle && (
            <NewPostModal
              toShare={true}
              sharePreviewData={postState}
              withImage={toggleNewPostModal.withImage}
              profileInfo={authentication.user}
              setcreateposttext={() => {}}
              getpostprocess={() => {}}
              onclose={settoggleNewPostModal}
            />
          )}
        </div>
        {!isSharePreview && (
          <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[0px] tw-justify-center">
            <motion.div
              initial={{
                height: toggleActivityCounts > 0 ? "auto" : "0px",
                paddingTop: toggleActivityCounts > 0 ? "5px" : "0px",
              }}
              animate={{
                height: toggleActivityCounts > 0 ? "auto" : "0px",
                paddingTop: toggleActivityCounts > 0 ? "5px" : "0px",
              }}
              className="tw-w-full tw-flex tw-flex-row tw-gap-[15px] tw-items-center tw-overflow-hidden"
            >
              <div className="tw-flex tw-flex-row">
                {postState.preview
                  .filter((flt) => flt.count > 0)
                  .map((mp, i) => {
                    if (emojilist.length > 0) {
                      return (
                        <span key={i} className="-tw-mr-[10px]">
                          {
                            emojilist.filter(
                              (flt) => flt.emoji_id === mp.emoji,
                            )[0].emoji_content
                          }
                        </span>
                      );
                    }
                  })}
              </div>
              <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
                {total_reactions > 0 && (
                  <span className="tw-text-[12px] tw-text-gray-800">
                    {total_reactions}{" "}
                    {total_reactions === 1 ? " reaction" : " reactions"}
                  </span>
                )}
                <div className="tw-flex tw-gap-[10px] tw-items-center">
                  {commentsCount > 0 && (
                    <span className="tw-text-[12px] tw-text-gray-800">
                      {commentsCount}{" "}
                      {commentsCount === 1 ? " comment" : " comments"}
                    </span>
                  )}
                  {shareCount > 0 && (
                    <span className="tw-text-[12px] tw-text-gray-800">
                      {shareCount} {shareCount === 1 ? " share" : " shares"}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
            <hr className="tw-w-full tw-text-[#666666] tw-border-white tw-opacity-[0.4] tw-mb-[5px] tw-z-[0]" />
            <div className="tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center">
              <button
                onMouseEnter={() => {
                  settoggleEmojis(true);
                }}
                onMouseLeave={() => {
                  settoggleEmojis(false);
                }}
                disabled={emojiLoading}
                className="tw-relative tw-inline-block tw-bg-transparent tw-flex-col tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]"
              >
                <motion.div
                  className="tw-absolute tw-min-h-[50px] tw-h-full tw-rounded-full tw-bg-white tw-shadow-lg tw-bottom-[calc(100%+15px)]"
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: toggleEmojis ? 1 : 0,
                  }}
                >
                  <PostEmojis
                    post_id={postState.post_id}
                    reaction={postState.user_reaction}
                    onProcessEmojiSelection={onProcessEmojiSelection}
                    onSuccessEmojiSelection={onSuccessEmojiSelection}
                  />
                </motion.div>
                {postState.user_reaction ? (
                  <div className="tw-text-[25px] tw-flex-1 tw-justify-center tw-items-center -tw-mt-[6px]">
                    {emojilist.length > 0 &&
                      (emojilist.filter(
                        (flt: Emoji) =>
                          flt.emoji_id === postState.user_reaction,
                      )[0].emoji_content ??
                        "...")}
                  </div>
                ) : (
                  <BiLike style={{ fontSize: "25px", color: "#666666" }} />
                )}
              </button>
              <button
                onClick={() => {
                  settogglePostCarousel(true);
                }}
                className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]"
              >
                <LiaComment style={{ fontSize: "25px", color: "#666666" }} />
              </button>
              <button
                onClick={() => {
                  settoggleNewPostModal({ toggle: true, withImage: false });
                }}
                className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]"
              >
                <PiShareFat style={{ fontSize: "25px", color: "#666666" }} />
              </button>
              {postOwnerUserID === authentication.user.userID && (
                <button className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]">
                  <BsPinMap style={{ fontSize: "22px", color: "#666666" }} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  );
}

export default PostItem;
