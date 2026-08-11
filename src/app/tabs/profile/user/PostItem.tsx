/* eslint-disable @typescript-eslint/no-explicit-any */
// import React from 'react'
import { useEffect, useMemo, useRef, useState } from "react";
import { BiLike } from "react-icons/bi";
import { LiaComment } from "react-icons/lia";
import { PiShareFat } from "react-icons/pi";
import { BsFileEarmarkExcel, BsPinMap } from "react-icons/bs";
import {
  AuthenticationInterface,
  Emoji,
  // IActivityCounts,
  IPost,
  IReference,
} from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import Modal from "@/app/reusables/Modal";
import { IoMdClose } from "react-icons/io";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import LoadedPostItem from "./LoadedPostItem";
import { motion, useInView } from "framer-motion";
import PostEmojis from "@/app/reusables/PostEmojis";
import { GetReactionTotalRequest } from "@/reusables/hooks/requests";
import PostComment from "@/app/widgets/items/PostComment";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import { timeSince } from "@/reusables/hooks/reusable";
import PostPrivacyIcon from "@/app/reusables/PostPrivacyIcon";
import { persistViewPosts } from "@/reusables/hooks/localforagehelper";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import PostOptions from "./PostOptions";
import OverlayLoader from "@/app/reusables/loaders/OverlayLoader";
import OverlayMessage from "@/app/reusables/catchers/OverlayMessage";
import { Avatar } from "@/reusables/design";
import TaggingSummary from "@/app/reusables/TaggingSummary";

function PostItem({
  isSharePreview,
  mp,
  show_archived,
}: {
  isSharePreview: boolean;
  mp: IPost;
  show_archived?: boolean;
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
  const [isProcessing, setisProcessing] = useState<boolean>(false);
  const [isRestored, setisRestored] = useState<boolean>(false);

  const timeDetail = timeSince(new Date(postState.date_posted));
  const dateposted = timeDetail;
  const textRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const location = useLocation();

  const postAuthorAvatar = (size = 35) => {
    if (postState.entity.type !== "user") {
      return (
        <Avatar
          id={postState.entity.details.slug}
          name={postState.entity.details.name}
          src={
            postState.entity.details.profile !== "none"
              ? postState.entity.details.profile
              : undefined
          }
          size={size}
        />
      );
    }

    return (
      <Avatar
        id={postState.entity.details.username}
        name={`${postState.entity.details.first_name} ${postState.entity.details.last_name}`}
        src={
          postState.entity.details.profile !== "none"
            ? postState.entity.details.profile
            : undefined
        }
        size={size}
      />
    );
  };

  const postOwnerUserID = postState.entity.details.username;

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
      entity_reaction: emoji_id,
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

  const ref = useRef<HTMLDivElement>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const isInView = useInView(ref, {
    amount: 0.6,
  });

  useEffect(() => {
    const isInNewsfeed = location.pathname === "/";
    if (authentication.user.entity_id !== postState.entity.id || isInNewsfeed) {
      if (isInView) {
        const viewedDate = new Date().toISOString();
        sessionStartTimeRef.current = Date.now();
        persistViewPosts(postState.post_id, {
          user_id: authentication.user.entity_id,
          post_owner_id: postState.entity.id,
          duration: 0.5,
          created_at: viewedDate,
        });
      } else if (!isInView && sessionStartTimeRef.current) {
        const viewedDate = new Date(sessionStartTimeRef.current).toISOString();
        const endTime = Date.now();
        const duration = (endTime - sessionStartTimeRef.current) / 1000;
        sessionStartTimeRef.current = null;
        persistViewPosts(postState.post_id, {
          user_id: authentication.user.entity_id,
          post_owner_id: postState.entity.id,
          duration: duration,
          created_at: viewedDate,
        });
      }
    }
  }, [authentication.user.entity_id, isInView, postState, location]);

  if (postState.deleted_at || (!show_archived && postState.is_archived)) {
    return (
      <div className="cl-post-item-unavailable tw-flex tw-flex-col tw-gap-[15px] tw-w-full tw-h-auto tw-min-h-[200px] tw-items-center tw-justify-center">
        <BsFileEarmarkExcel
          style={{ fontSize: "55px", color: "var(--text-2)" }}
        />
        <div className="tw-flex tw-w-full tw-max-w-[200px] tw-items-center tw-justify-center cl-text-body-sm tw-text-[var(--text-2)] ">
          <span>This post is unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="cl-post-item-shell tw-w-full tw-relative">
      {isProcessing && (
        <OverlayLoader className="cl-feed-card__overlay tw-absolute tw-w-full tw-h-full tw-opacity-[0.8] tw-z-[5] tw-flex tw-items-center tw-justify-center tw-rounded-md" />
      )}
      {isRestored && (
        <OverlayMessage
          message="Post Restored"
          className="cl-feed-card__overlay tw-absolute tw-w-full tw-h-full tw-opacity-[0.8] tw-z-[5] tw-flex tw-items-center tw-justify-center tw-rounded-md"
        />
      )}
      {minimizedCaption !== null && (
        <div
          style={{
            border: isSharePreview
              ? "1px solid var(--border)"
              : "0px solid transparent",
            borderRadius: isSharePreview ? "var(--r-lg)" : "0px",
            overflow: isSharePreview ? "hidden" : "visible",
          }}
          className="cl-post-item-card tw-w-full tw-p-[20px] tw-pb-[7px] tw-flex tw-flex-col tw-gap-[10px]"
        >
          <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
            <div className="tw-w-[35px] tw-h-[35px] tw-mr-[10px]">
              {postAuthorAvatar(35)}
            </div>
            <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-gap-[2px]">
              <div className="tw-text-left tw-flex tw-flex-wrap tw-items-center">
                <span
                  className="cl-feed-card__title tw-break-keep cl-text-body tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
                  onClick={() => {
                    if (postState.entity.type === "realm") {
                      navigate(`/${postState.entity.details.slug}`);
                      return;
                    }
                    navigate(`/${postState.entity.details.username}`);
                  }}
                >
                  {postState.entity.type !== "user" ? (
                    <div className="tw-flex tw-items-center tw-gap-[4px]">
                      <span>{postState.entity.details.name}</span>
                      {postState.entity.details.is_verified && (
                        <RiVerifiedBadgeFill size={16} color="var(--brand)" />
                      )}
                    </div>
                  ) : (
                    <div className="tw-flex tw-items-center tw-gap-[4px]">
                      <span>
                        {postState.entity.details.first_name}
                        {postState.entity.details.middle_name == "N/A"
                          ? ""
                          : ` ${postState.entity.details.middle_name}`}{" "}
                        {postState.entity.details.last_name}
                      </span>
                      {postState.entity.details.is_badged && (
                        <RiVerifiedBadgeFill size={16} color="var(--brand)" />
                      )}
                    </div>
                  )}
                </span>
                &nbsp;
                {postState.content_type === "profile" && (
                  <span className="cl-text-body">changed profile picture</span>
                )}
                {postState.content_type === "cover_photo" && (
                  <span className="cl-text-body">changed cover photo</span>
                )}
                &nbsp;
                {postState.tagging.length > 0 && (
                  <TaggingSummary tagging={postState.tagging} />
                )}
              </div>
              <span className="cl-text-caption">
                <PostPrivacyIcon status={postState.privacy_status} />
                {dateposted}
              </span>
            </div>
            {authentication.auth && (
              <PostOptions
                post={postState}
                onProcess={() => {
                  setisProcessing(true);
                }}
                onFinish={(type: string) => {
                  switch (type) {
                    case "deleted":
                      setpostState((prev) => ({
                        ...prev,
                        deleted_at: true,
                        deleted_by: true,
                      }));
                      break;
                    case "archived":
                      setpostState((prev) => ({ ...prev, is_archived: true }));
                      break;
                    case "unarchived":
                      setpostState((prev) => ({ ...prev, is_archived: false }));
                      setisProcessing(false);
                      setisRestored(true);
                      break;
                    default:
                      setisProcessing(false);
                      break;
                  }
                }}
                onError={() => {
                  setisProcessing(false);
                }}
              />
            )}
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
              <span ref={textRef} className={`cl-text-body tw-text-left c1`}>
                {postState.caption}
              </span>
            </div>
            {postState.link_preview && (
              <LinkPreviewCard
                preview={postState.link_preview}
                variant="display"
              />
            )}
            {minimizedCaption && (
              <button
                onClick={() => {
                  setminimizedCaption(false);
                }}
                className={`cl-feed-card__toggle cl-text-caption tw-text-left tw-bg-transparent tw-p-[5px] tw-border-none tw-cursor-pointer tw-rounded-[4px]`}
              >
                Expand
              </button>
            )}
            {!minimizedCaption && postState.caption.length >= 600 && (
              <button
                onClick={() => {
                  setminimizedCaption(true);
                }}
                className={`cl-feed-card__toggle cl-text-caption tw-text-left tw-bg-transparent tw-p-[5px] tw-border-none tw-cursor-pointer tw-rounded-[4px]`}
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
                    className={`cl-post-item-modal-shell custom:tw-rounded-[7px] tw-rounded-[0px] custom:tw-w-[95%] custom:tw-h-[95%] tw-w-[100%] tw-h-[100%] custom:tw-max-h-[800px] tw-max-h-full tw-flex tw-flex-row tw-flex-wrap ${
                      postState.is_shared || postState.references.length === 0
                        ? ""
                        : "custom:tw-overflow-hidden"
                    } tw-overflow-auto ${
                      window.innerWidth >= 842 ? "x-scroll" : "t-scroll"
                    }`}
                  >
                    {/* <div className="tw-w-[calc(100%-22px)] tw-p-[10px] tw-pl-[12px] tw-pr-[10px] tw-pt-[10px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
                        <span className="cl-text-body tw-font-semibold tw-flex tw-flex-1 tw-font-Inter">
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
                          } else if (
                            mpr.reference_media_type.includes("video")
                          ) {
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
                      } tw-min-w-[350px] cl-post-item-modal-side tw-flex-col tw-pb-[10px] ${
                        postState.is_shared || postState.references.length === 0
                          ? ""
                          : "custom:tw-h-full"
                      }`}
                    >
                      <div className="tw-w-full tw-p-[25px] tw-flex tw-justify-between tw-gap-[12px]">
                        <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
                          {postAuthorAvatar(35)}
                          <div className="tw-flex tw-flex-col tw-items-start tw-gap-[2px]">
                            <div className="tw-text-left tw-flex tw-flex-wrap tw-items-center">
                              <span
                                className="cl-feed-card__title tw-break-keep cl-text-body tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
                                onClick={() => {
                                  if (postState.entity.type === "realm") {
                                    navigate(
                                      `/${postState.entity.details.slug}`,
                                    );
                                    return;
                                  }
                                  navigate(
                                    `/${postState.entity.details.username}`,
                                  );
                                }}
                              >
                                {postState.entity.type !== "user" ? (
                                  <div className="tw-flex tw-items-center tw-gap-[4px]">
                                    <span>{postState.entity.details.name}</span>
                                    {postState.entity.details.is_verified && (
                                      <RiVerifiedBadgeFill
                                        size={16}
                                        color="var(--brand)"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div className="tw-flex tw-items-center tw-gap-[4px]">
                                    <span>
                                      {postState.entity.details.first_name}
                                      {postState.entity.details.middle_name ==
                                      "N/A"
                                        ? ""
                                        : ` ${postState.entity.details.middle_name}`}{" "}
                                      {postState.entity.details.last_name}
                                    </span>
                                    {postState.entity.details.is_badged && (
                                      <RiVerifiedBadgeFill
                                        size={16}
                                        color="var(--brand)"
                                      />
                                    )}
                                  </div>
                                )}
                              </span>
                              &nbsp;
                              {postState.tagging.length > 0 && (
                                <TaggingSummary tagging={postState.tagging} />
                              )}
                            </div>
                            <span className="cl-text-caption">
                              {/* PostItem's own expanded view - the same post
                                  as the collapsed header above, so the same
                                  audience. */}
                              <PostPrivacyIcon
                                status={postState.privacy_status}
                              />
                              {dateposted}
                            </span>
                          </div>
                        </div>
                        {authentication.auth && (
                          <PostOptions
                            post={postState}
                            onProcess={() => {
                              setisProcessing(true);
                            }}
                            onFinish={(type: string) => {
                              switch (type) {
                                case "deleted":
                                  setpostState((prev) => ({
                                    ...prev,
                                    deleted_at: true,
                                    deleted_by: true,
                                  }));
                                  break;
                                case "archived":
                                  setpostState((prev) => ({
                                    ...prev,
                                    is_archived: true,
                                  }));
                                  break;
                                case "unarchived":
                                  setpostState((prev) => ({
                                    ...prev,
                                    is_archived: false,
                                  }));
                                  setisProcessing(false);
                                  setisRestored(true);
                                  break;
                                default:
                                  setisProcessing(false);
                                  break;
                              }
                            }}
                            onError={() => {
                              setisProcessing(false);
                            }}
                          />
                        )}
                        <button
                          onClick={() => {
                            settogglePostCarousel(false);
                          }}
                          className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
                        >
                          <IoMdClose
                            style={{ fontSize: "17px", color: "var(--text)" }}
                          />
                        </button>
                      </div>
                      <div
                        className={`tw-w-full tw-px-[25px] tw-flex tw-flex-col tw-items-center tw-gap-[10px] tw-min-h-[35px] tw-justify-center`}
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
                            className={`cl-text-body tw-text-left c1`}
                          >
                            {postState.caption}
                          </span>
                        </div>
                        {postState.link_preview && (
                          <LinkPreviewCard
                            preview={postState.link_preview}
                            variant="display"
                          />
                        )}
                        {minimizedCaption && (
                          <button
                            onClick={() => {
                              setminimizedCaption(false);
                            }}
                            className={`cl-feed-card__toggle cl-text-caption tw-text-left tw-bg-transparent tw-p-[5px] tw-border-none tw-cursor-pointer tw-rounded-[4px]`}
                          >
                            Expand
                          </button>
                        )}
                        {!minimizedCaption &&
                          postState.caption.length >= 600 && (
                            <button
                              onClick={() => {
                                setminimizedCaption(true);
                              }}
                              className={`cl-feed-card__toggle cl-text-caption tw-text-left tw-bg-transparent tw-p-[5px] tw-border-none tw-cursor-pointer tw-rounded-[4px]`}
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
                      <div className="tw-w-full tw-px-[25px] tw-mt-[10px] tw-pb-[5px]">
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
                                <span className="cl-text-caption tw-text-[var(--text-2)]">
                                  {total_reactions}{" "}
                                  {total_reactions === 1
                                    ? " reaction"
                                    : " reactions"}
                                </span>
                              )}
                              <div className="tw-flex tw-gap-[10px] tw-items-center">
                                {commentsCount > 0 && (
                                  <span className="cl-text-caption tw-text-[var(--text-2)]">
                                    {commentsCount}{" "}
                                    {commentsCount === 1
                                      ? " comment"
                                      : " comments"}
                                  </span>
                                )}
                                {shareCount > 0 && (
                                  <span className="cl-text-caption tw-text-[var(--text-2)]">
                                    {shareCount}{" "}
                                    {shareCount === 1 ? " share" : " shares"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                          <hr className="cl-feed-card__divider tw-w-full tw-mb-[5px] tw-z-[0]" />
                          <div className="tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center">
                            {authentication.auth && (
                              <button
                                onMouseEnter={() => {
                                  settoggleEmojis(true);
                                  if (timeoutRef.current) {
                                    clearTimeout(timeoutRef.current);
                                    timeoutRef.current = null;
                                  }
                                }}
                                onMouseLeave={() => {
                                  timeoutRef.current = setTimeout(() => {
                                    settoggleEmojis(false);
                                  }, 700);
                                }}
                                disabled={emojiLoading}
                                className="cl-feed-card__action tw-relative tw-inline-block tw-bg-transparent tw-flex-col tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
                              >
                                <motion.div
                                  className="cl-feed-card__reaction-popover tw-absolute tw-min-h-[50px] tw-h-full tw-rounded-full tw-shadow-lg tw-bottom-[calc(100%+15px)]"
                                  initial={{
                                    scale: 0,
                                  }}
                                  animate={{
                                    scale: toggleEmojis ? 1 : 0,
                                  }}
                                >
                                  <PostEmojis
                                    post_id={postState.post_id}
                                    reaction={postState.entity_reaction}
                                    onProcessEmojiSelection={
                                      onProcessEmojiSelection
                                    }
                                    onSuccessEmojiSelection={
                                      onSuccessEmojiSelection
                                    }
                                  />
                                </motion.div>
                                {postState.entity_reaction ? (
                                  <div className="tw-text-[25px] tw-flex-1 tw-justify-center tw-items-center -tw-mt-[6px]">
                                    {emojilist.length > 0 &&
                                      (emojilist.filter(
                                        (flt: Emoji) =>
                                          flt.emoji_id ===
                                          postState.entity_reaction,
                                      )[0].emoji_content ??
                                        "...")}
                                  </div>
                                ) : (
                                  <BiLike
                                    style={{
                                      fontSize: "25px",
                                      color: "var(--text-2)",
                                    }}
                                  />
                                )}
                              </button>
                            )}
                            <button className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]">
                              <LiaComment
                                style={{
                                  fontSize: "25px",
                                  color: "var(--text-2)",
                                }}
                              />
                            </button>
                            {authentication.auth && (
                              <button
                                onClick={() => {
                                  settoggleNewPostModal({
                                    toggle: true,
                                    withImage: false,
                                  });
                                }}
                                className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
                              >
                                <PiShareFat
                                  style={{
                                    fontSize: "25px",
                                    color: "var(--text-2)",
                                  }}
                                />
                              </button>
                            )}
                            {postOwnerUserID === authentication.user.userID && (
                              <button className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]">
                                <BsPinMap
                                  style={{
                                    fontSize: "22px",
                                    color: "var(--text-2)",
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
                          onCommentCountChange={(delta) =>
                            setpostState((prev) => ({
                              ...prev,
                              score: {
                                ...prev.score,
                                comments_count: Math.max(
                                  0,
                                  prev.score.comments_count + delta,
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    {/* <div className="tw-h-[15px]" /> */}
                  </div>
                }
              />
            )}
            {postState.references.length > 0 && !postState.is_shared && (
              <div className="cl-feed-card__media-grid tw-w-[calc(100%+40px)] tw-flex tw-flex-row tw-flex-wrap tw-gap-[2px] tw-min-h-[400px]">
                {" "}
                {/**tw-bg-[var(--surface-2)]*/}
                {postState.references.map((mpu: IReference, i: number) => {
                  if (i <= 3) {
                    if (mpu.reference_media_type.includes("image")) {
                      if (postState.references.length === 1) {
                        return (
                          <div
                            onClick={() => {
                              if (!isSharePreview && !postState.is_archived) {
                                settogglePostCarousel(true);
                              }
                            }}
                            key={mpu.reference_id}
                            className="tw-flex tw-max-h-[500px] tw-flex-1 tw-bg-[var(--surface-2)] tw-min-w-[100px] lg:tw-min-w-[200px]"
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
                              if (!isSharePreview && !postState.is_archived) {
                                settogglePostCarousel(true);
                              }
                            }}
                            key={mpu.reference_id}
                            className="tw-flex tw-h-[400px] tw-flex-1 tw-bg-[var(--surface-2)] tw-min-w-[100px] lg:tw-min-w-[200px]"
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
                          className="tw-flex tw-h-[400px] tw-flex-1 tw-bg-[var(--surface-2)] tw-min-w-[100px] lg:tw-min-w-[200px]"
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
                {postState.references.length > 4 && (
                  <div
                    onClick={() => {
                      settogglePostCarousel(true);
                    }}
                    className="tw-flex tw-max-h-[400px] tw-flex-1 tw-bg-[var(--surface-2)] tw-min-w-[200px]"
                  >
                    <div className="tw-cursor-pointer tw-select-none tw-relative tw-h-full tw-w-full tw-bg-[var(--surface-2)] tw-opacity-[0.85] tw-top-0 tw-left-0 tw-z-[1] tw-flex tw-items-center tw-justify-center">
                      <div>
                        <span className="tw-text-[var(--text)] tw-font-Inter tw-font-semibold cl-text-display-xl">
                          + {postState.references.length - 4}
                        </span>
                      </div>
                    </div>
                    {postState.references[4].reference_media_type ===
                    "image" ? (
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
          </div>
          {!isSharePreview && !postState.is_archived && (
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
                    <span className="cl-text-caption tw-text-[var(--text-2)]">
                      {total_reactions}{" "}
                      {total_reactions === 1 ? " reaction" : " reactions"}
                    </span>
                  )}
                  <div className="tw-flex tw-gap-[10px] tw-items-center">
                    {commentsCount > 0 && (
                      <span className="cl-text-caption tw-text-[var(--text-2)]">
                        {commentsCount}{" "}
                        {commentsCount === 1 ? " comment" : " comments"}
                      </span>
                    )}
                    {shareCount > 0 && (
                      <span className="cl-text-caption tw-text-[var(--text-2)]">
                        {shareCount} {shareCount === 1 ? " share" : " shares"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              <hr className="cl-feed-card__divider tw-w-full tw-mb-[5px] tw-z-[0]" />
              <div className="tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center">
                {authentication.auth && (
                  <button
                    onMouseEnter={() => {
                      settoggleEmojis(true);
                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      timeoutRef.current = setTimeout(() => {
                        settoggleEmojis(false);
                      }, 700);
                    }}
                    disabled={emojiLoading}
                    className="cl-feed-card__action tw-relative tw-inline-block tw-bg-transparent tw-flex-col tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
                  >
                    <motion.div
                      className="cl-feed-card__reaction-popover tw-absolute tw-min-h-[50px] tw-h-full tw-rounded-full tw-shadow-lg tw-bottom-[calc(100%+15px)]"
                      initial={{
                        scale: 0,
                      }}
                      animate={{
                        scale: toggleEmojis ? 1 : 0,
                      }}
                    >
                      <PostEmojis
                        post_id={postState.post_id}
                        reaction={postState.entity_reaction}
                        onProcessEmojiSelection={onProcessEmojiSelection}
                        onSuccessEmojiSelection={onSuccessEmojiSelection}
                      />
                    </motion.div>
                    {postState.entity_reaction ? (
                      <div className="tw-text-[25px] tw-flex-1 tw-justify-center tw-items-center -tw-mt-[6px]">
                        {emojilist.length > 0 &&
                          (emojilist.filter(
                            (flt: Emoji) =>
                              flt.emoji_id === postState.entity_reaction,
                          )[0].emoji_content ??
                            "...")}
                      </div>
                    ) : (
                      <BiLike
                        style={{ fontSize: "25px", color: "var(--text-2)" }}
                      />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    settogglePostCarousel(true);
                  }}
                  className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
                >
                  <LiaComment
                    style={{ fontSize: "25px", color: "var(--text-2)" }}
                  />
                </button>
                {authentication.auth && (
                  <button
                    onClick={() => {
                      settoggleNewPostModal({ toggle: true, withImage: false });
                    }}
                    className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
                  >
                    <PiShareFat
                      style={{ fontSize: "25px", color: "var(--text-2)" }}
                    />
                  </button>
                )}
                {postOwnerUserID === authentication.user.userID && (
                  <button className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]">
                    <BsPinMap
                      style={{ fontSize: "22px", color: "var(--text-2)" }}
                    />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostItem;

