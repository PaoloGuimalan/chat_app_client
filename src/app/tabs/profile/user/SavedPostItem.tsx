/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  AuthenticationInterface,
  Emoji,
  IPost,
  IReference,
  ISavedPost,
  ITagging,
} from "@/reusables/vars/interfaces";
import { Avatar } from "@/reusables/design";
import { useSelector } from "react-redux";
import { useMemo, useRef, useState } from "react";
import { GoBookmarkSlashFill } from "react-icons/go";
import { TiArrowLeftThick } from "react-icons/ti";
import {
  GetPostPreviewRequest,
  GetReactionTotalRequest,
  UnsavePostRequest,
} from "@/reusables/hooks/requests";
import OverlayMessage from "@/app/reusables/catchers/OverlayMessage";
import PostComment from "@/app/widgets/items/PostComment";
import Modal from "@/app/reusables/Modal";
import { Carousel } from "react-responsive-carousel";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import PostOptions from "./PostOptions";
import { IoMdClose } from "react-icons/io";
import { timeSince } from "@/reusables/hooks/reusable";
import { useNavigate } from "react-router-dom";
import LoadedPostItem from "./LoadedPostItem";
import { motion } from "framer-motion";
import PostEmojis from "@/app/reusables/PostEmojis";
import { BiLike } from "react-icons/bi";
import { LiaComment } from "react-icons/lia";
import { PiShareFat } from "react-icons/pi";
import { BsPinMap } from "react-icons/bs";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function SavedPostItem({ savedPost }: { savedPost: ISavedPost }) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist);
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
  const [minimizedCaption, setminimizedCaption] = useState<boolean | null>(
    null,
  );
  const [toggleEmojis, settoggleEmojis] = useState<boolean>(false);
  const [emojiLoading, setemojiLoading] = useState<boolean>(false);
  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const onProcessEmojiSelection = (emoji_id: string) => {
    settoggleEmojis(false);
    setemojiLoading(true);
    setpreviewPost((prev: IPost | null) => {
      if (prev) {
        return {
          ...prev,
          user_reaction: emoji_id,
        };
      }

      return prev;
    });
  };

  const onSuccessEmojiSelection = (isReactionProcessed: boolean) => {
    setemojiLoading(false);

    if (!isReactionProcessed) {
      setpreviewPost(previewPost);

      return;
    }

    if (!previewPost) {
      return;
    }

    GetReactionTotalRequest(previewPost.post_id)
      .then((response) => {
        setpreviewPost((prev: IPost | null) => {
          if (prev) {
            return {
              ...prev,
              preview: response,
            };
          }
          return prev;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

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

  const postOwnerUserID = savedPost.post.user.username;

  const navigate = useNavigate();

  const timeDetail = timeSince(new Date(savedPost.post.date_posted));
  const dateposted = timeDetail;
  const textRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleActivityCounts = useMemo(() => {
    if (previewPost) {
      const reactionsCount = previewPost.preview.reduce(
        (sum, item) => sum + item.count,
        0,
      );
      const activityCount =
        previewPost.score.comments_count + previewPost.score.shares_count;

      return reactionsCount + activityCount;
    }

    return 0;
  }, [previewPost]);

  const total_reactions = useMemo(() => {
    if (previewPost) {
      return previewPost.preview.reduce((sum, item) => sum + item.count, 0);
    }

    return 0;
  }, [previewPost]);

  const commentsCount = useMemo(() => {
    if (previewPost) {
      return previewPost.score.comments_count;
    }

    return 0;
  }, [previewPost]);
  const shareCount = useMemo(() => {
    if (previewPost) {
      return previewPost.score.shares_count;
    }

    return 0;
  }, [previewPost]);

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
            username: authentication.user.username,
          }}
          realmInfo={null}
          setcreateposttext={() => {}}
          getpostprocess={() => {}}
          onclose={settoggleNewPostModal}
        />
      )}
      {togglePostCarousel && previewPost && (
        <Modal
          component={
            <div
              style={{
                maxWidth:
                  previewPost.references.length > 0
                    ? previewPost.is_shared
                      ? window.innerWidth >= 842
                        ? "600px"
                        : "none"
                      : "1400px"
                    : window.innerWidth >= 842
                      ? "600px"
                      : "none",
              }}
              className={`cl-feed-card cl-feed-card__modal-shell custom:tw-rounded-[7px] tw-rounded-[0px] custom:tw-w-[95%] custom:tw-h-[95%] tw-w-[100%] tw-h-[100%] custom:tw-max-h-[800px] tw-max-h-full tw-flex tw-flex-row tw-flex-wrap ${
                previewPost.is_shared || previewPost.references.length === 0
                  ? ""
                  : "custom:tw-overflow-hidden"
              } tw-overflow-auto ${
                window.innerWidth >= 842 ? "x-scroll" : "t-scroll"
              }`}
            >
              {!previewPost.is_shared && (
                <Carousel
                  className="tw-bg-[var(--surface-2)] tw-w-full tw-h-full tw-flex-1 tw-min-w-[350px]"
                  showIndicators={false}
                  showThumbs={false}
                >
                  {previewPost.references.map((mpr: IReference) => {
                    if (mpr.reference_media_type.includes("image")) {
                      return (
                        <div
                          key={mpr.reference_id}
                          className="tw-h-full tw-bg-[var(--surface-2)]"
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
                          className="tw-h-full tw-max-h-full tw-bg-[var(--surface-2)]"
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
                  previewPost.references.length > 0
                    ? previewPost.is_shared
                      ? "custom:tw-max-w-full"
                      : "custom:tw-max-w-[400px]"
                    : "custom:tw-max-w-full"
                } tw-min-w-[350px] cl-feed-card__modal-side tw-flex-col tw-pb-[10px] ${
                  previewPost.is_shared || previewPost.references.length === 0
                    ? ""
                    : "custom:tw-h-full"
                }`}
              >
                <div className="tw-w-[calc(100%-50px)] tw-p-[25px] tw-flex tw-justify-between">
                  <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
                    <Avatar
                      id={previewPost.author_realm?.slug ?? previewPost.user.username}
                      name={previewPost.author_realm?.name ?? `${previewPost.user.first_name} ${previewPost.user.last_name}`}
                      src={
                        previewPost.author_realm
                          ? previewPost.author_realm.profile !== "none"
                            ? previewPost.author_realm.profile
                            : undefined
                          : previewPost.user.profile !== "none"
                            ? previewPost.user.profile
                            : undefined
                      }
                      size={35}
                    />
                    <div className="tw-flex tw-flex-col tw-items-start tw-gap-[2px]">
                      <div className="tw-text-left tw-flex tw-flex-wrap">
                        <span
                          className="cl-feed-card__title tw-break-keep tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
                          onClick={() => {
                            if (previewPost.author_realm) {
                              navigate(`/${previewPost.author_realm.slug}`);
                              return;
                            }

                            navigate(`/${previewPost.user.username}`);
                          }}
                        >
                          {previewPost.author_realm ? (
                            <div className="tw-flex tw-items-center tw-gap-[4px]">
                              <span>{previewPost.author_realm.name}</span>
                              {previewPost.author_realm.is_verified && (
                                <RiVerifiedBadgeFill
                                  size={16}
                                  color="var(--brand)"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="tw-flex tw-items-center tw-gap-[4px]">
                              <span>
                                {previewPost.user.first_name}
                                {previewPost.user.middle_name == "N/A"
                                  ? ""
                                  : ` ${previewPost.user.middle_name}`}{" "}
                                {previewPost.user.last_name}
                              </span>
                              {previewPost.user.is_badged && (
                                <RiVerifiedBadgeFill
                                  size={16}
                                  color="var(--brand)"
                                />
                              )}
                            </div>
                          )}
                        </span>
                        &nbsp;
                        {previewPost.tagging.length > 0 && (
                          <span className="tw-text-[14px]">is with</span>
                        )}
                        &nbsp;
                        {previewPost.tagging.length > 0 &&
                          previewPost.tagging.map(
                            (mptg: ITagging, i: number) => {
                              return (
                                <span
                                  className="cl-feed-card__title tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
                                  onClick={() => {
                                    navigate(`/${mptg.user.username}`);
                                  }}
                                  key={i}
                                >
                                  <div className="tw-flex tw-items-center tw-gap-[4px]">
                                    <span>
                                      {mptg.user.first_name}
                                      {mptg.user.middle_name == "N/A"
                                        ? ""
                                        : ` ${mptg.user.middle_name}`}{" "}
                                      {mptg.user.last_name}
                                    </span>
                                    {mptg.user.is_badged && (
                                      <RiVerifiedBadgeFill
                                        size={16}
                                        color="var(--brand)"
                                      />
                                    )}
                                  </div>
                                </span>
                              );
                            },
                          )}
                      </div>
                      <span className="tw-text-[12px]">{dateposted}</span>
                    </div>
                  </div>
                  {authentication.auth && (
                    <PostOptions
                      post={previewPost}
                      onProcess={() => {}}
                      onFinish={(type: string) => {
                        switch (type) {
                          case "deleted":
                            setpreviewPost((prev) => {
                              if (prev) {
                                return {
                                  ...prev,
                                  deleted_at: true,
                                  deleted_by: true,
                                };
                              }

                              return prev;
                            });
                            break;
                          case "archived":
                            setpreviewPost((prev) => {
                              if (prev) {
                                return {
                                  ...prev,
                                  is_archived: true,
                                };
                              }

                              return prev;
                            });
                            break;
                          case "unarchived":
                            setpreviewPost((prev) => {
                              if (prev) {
                                return {
                                  ...prev,
                                  is_archived: false,
                                };
                              }

                              return prev;
                            });
                            setisRestored(true);
                            break;
                          default:
                            break;
                        }
                      }}
                      onError={() => {}}
                    />
                  )}
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
                      minimizedCaption ? "tw-max-h-[120px]" : "tw-max-h-none"
                    } tw-overflow-y-hidden`}
                  >
                    <span
                      ref={textRef}
                      className={`tw-text-[14px] tw-text-left c1`}
                    >
                      {previewPost.caption}
                    </span>
                  </div>
                  {minimizedCaption && (
                    <button
                      onClick={() => {
                        setminimizedCaption(false);
                      }}
                      className={`cl-feed-card__toggle tw-text-[12px] tw-text-left tw-bg-transparent tw-p-[5px] tw-border-none tw-cursor-pointer tw-rounded-[4px]`}
                    >
                      Expand
                    </button>
                  )}
                  {!minimizedCaption && previewPost.caption.length >= 600 && (
                    <button
                      onClick={() => {
                        setminimizedCaption(true);
                      }}
                      className={`cl-feed-card__toggle tw-text-[12px] tw-text-left tw-bg-transparent tw-p-[5px] tw-border-none tw-cursor-pointer tw-rounded-[4px]`}
                    >
                      See less
                    </button>
                  )}
                  {previewPost.is_shared &&
                    previewPost.references.map((mpu: any, i: number) => {
                      return <LoadedPostItem key={i} postID={mpu.reference} />;
                    })}
                </div>
                <div className="tw-w-[calc(100%-50px)] tw-pl-[25px] tw-pr-[25px] tw-mt-[10px] tw-pb-[5px]">
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
                        {previewPost.preview
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
                          <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                            {total_reactions}{" "}
                            {total_reactions === 1 ? " reaction" : " reactions"}
                          </span>
                        )}
                        <div className="tw-flex tw-gap-[10px] tw-items-center">
                          {commentsCount > 0 && (
                            <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                              {commentsCount}{" "}
                              {commentsCount === 1 ? " comment" : " comments"}
                            </span>
                          )}
                          {shareCount > 0 && (
                            <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                              {shareCount}{" "}
                              {shareCount === 1 ? " share" : " shares"}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    <hr className="cl-feed-card__divider tw-w-full tw-mb-[5px] tw-z-[0]" />
                    <div className="tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center">
                      <button
                        onMouseEnter={() => {
                          settoggleEmojis(true);
                        }}
                        onMouseLeave={() => {
                          settoggleEmojis(false);
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
                            post_id={previewPost.post_id}
                            reaction={previewPost.user_reaction}
                            onProcessEmojiSelection={onProcessEmojiSelection}
                            onSuccessEmojiSelection={onSuccessEmojiSelection}
                          />
                        </motion.div>
                        {previewPost.user_reaction ? (
                          <div className="tw-text-[25px] tw-flex-1 tw-justify-center tw-items-center -tw-mt-[6px]">
                            {emojilist.length > 0 &&
                              (emojilist.filter(
                                (flt: Emoji) =>
                                  flt.emoji_id === previewPost.user_reaction,
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
                      <button className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]">
                        <LiaComment
                          style={{ fontSize: "25px", color: "var(--text-2)" }}
                        />
                      </button>
                      <button
                        onClick={() => {
                          settogglePostCarousel(false);
                          settoggleNewPostModal({
                            toggle: true,
                            withImage: false,
                          });
                        }}
                        className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
                      >
                        <PiShareFat
                          style={{ fontSize: "25px", color: "var(--text-2)" }}
                        />
                      </button>
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
                    previewPost.is_shared
                      ? "custom:tw-overflow-y-hidden"
                      : "custom:tw-overflow-y-auto"
                  }
                >
                  <PostComment post_id={previewPost.post_id} parent_id={null} />
                </div>
              </div>
            </div>
          }
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
          id={savedPost.post.author_realm?.slug ?? savedPost.post.user.username}
          name={
            savedPost.post.author_realm?.name ??
            `${savedPost.post.user.first_name} ${savedPost.post.user.last_name}`
          }
          src={
            savedPost.post.author_realm
              ? savedPost.post.author_realm.profile &&
                savedPost.post.author_realm.profile !== "N/A"
                ? savedPost.post.author_realm.profile
                : undefined
              : savedPost.post.user.profile && savedPost.post.user.profile !== "none"
                ? savedPost.post.user.profile
                : undefined
          }
          size={isMobileView ? 85 : 120}
        />
        <div className="tw-flex tw-flex-col tw-flex-1 tw-items-start">
          <div className="tw-flex tw-flex-col tw-gap-[6px] tw-p-[5px] tw-items-start tw-flex-1">
            {savedPost.post.caption.trim() === "" ? (
              <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                {savedPost.post.author_realm?.name ??
                  savedPost.post.user.first_name}
                {"'s"} Post
              </span>
            ) : (
              <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-line-clamp-2 tw-text-left tw-text-[var(--text)]">
                {savedPost.post.caption}
              </span>
            )}
            <div className="tw-flex tw-gap-[5px] tw-items-center">
              <span className="tw-font-Inter tw-text-[12px] tw-text-[var(--text-2)]">
                {savedPost.post.content_type
                  .replace("_", " ")
                  .split(" ")
                  .map((word) => word[0].toUpperCase() + word.slice(1))
                  .join(" ")}
              </span>
              &bull;
              {savedPost.post.author_realm ? (
                <span className="tw-font-Inter tw-text-[12px] tw-text-[var(--text-2)]">
                  {savedPost.post.author_realm.name}
                </span>
              ) : (
                <span className="tw-font-Inter tw-text-[12px] tw-text-[var(--text-2)]">
                  {savedPost.post.user.first_name}
                  {savedPost.post.user.middle_name == "N/A"
                    ? ""
                    : ` ${savedPost.post.user.middle_name}`}{" "}
                  {savedPost.post.user.last_name}
                </span>
              )}
            </div>
          </div>
          <div className="tw-pl-[5px] tw-flex tw-gap-[6px]">
            <button
              disabled={isFetchingPreview}
              onClick={GetPostPreviewProcess}
              className="cl-display-card__button cl-display-card__button--muted tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none"
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
              className="cl-display-card__button cl-display-card__button--muted tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none"
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


