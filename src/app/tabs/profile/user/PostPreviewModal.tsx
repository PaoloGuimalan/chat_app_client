/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  AuthenticationInterface,
  Emoji,
  IPost,
  IReference,
} from "@/reusables/vars/interfaces";
import { Avatar } from "@/reusables/design";
import TaggingSummary from "@/app/reusables/TaggingSummary";
import { useSelector } from "react-redux";
import {
  Dispatch,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import { GetReactionTotalRequest } from "@/reusables/hooks/requests";
import PostComment from "@/app/widgets/items/PostComment";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
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

interface PostPreviewModalProps {
  post: IPost;
  /** Owns the post state so reaction/option updates survive modal close
   *  (e.g. the share composer reads it as sharePreviewData afterwards). */
  setPost: Dispatch<SetStateAction<IPost | null>>;
  onClose: () => void;
  /** Share button - parent closes this modal and opens its NewPostModal. */
  onShare: () => void;
  /** Extra hook after the default deleted/archived/unarchived state updates
   *  (SavedPostItem flips its "restored" overlay on "unarchived"). */
  onOptionFinish?: (type: string) => void;
}

// The full "view post" experience - media carousel + author header +
// reactions + comments - extracted verbatim from SavedPostItem so any
// surface (saved posts, search results, ...) opens posts identically.
function PostPreviewModal({
  post,
  setPost,
  onClose,
  onShare,
  onOptionFinish,
}: PostPreviewModalProps) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist);
  const navigate = useNavigate();

  const [minimizedCaption, setminimizedCaption] = useState<boolean | null>(
    null,
  );
  const [toggleEmojis, settoggleEmojis] = useState<boolean>(false);
  const [emojiLoading, setemojiLoading] = useState<boolean>(false);

  const textRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);

  const postOwnerUserID = post.entity.id;
  const dateposted = timeSince(new Date(post.date_posted));

  const onProcessEmojiSelection = (emoji_id: string) => {
    settoggleEmojis(false);
    setemojiLoading(true);
    setPost((prev: IPost | null) => {
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
      setPost(post);

      return;
    }

    GetReactionTotalRequest(post.post_id)
      .then((response) => {
        setPost((prev: IPost | null) => {
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

  const toggleActivityCounts = useMemo(() => {
    const reactionsCount = post.preview.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const activityCount = post.score.comments_count + post.score.shares_count;

    return reactionsCount + activityCount;
  }, [post]);

  const total_reactions = useMemo(() => {
    return post.preview.reduce((sum, item) => sum + item.count, 0);
  }, [post]);

  const commentsCount = useMemo(() => {
    return post.score.comments_count;
  }, [post]);
  const shareCount = useMemo(() => {
    return post.score.shares_count;
  }, [post]);

  return (
    <Modal
      component={
        <div
          style={{
            maxWidth:
              post.references.length > 0
                ? post.is_shared
                  ? window.innerWidth >= 842
                    ? "600px"
                    : "none"
                  : "1400px"
                : window.innerWidth >= 842
                  ? "600px"
                  : "none",
          }}
          className={`cl-feed-card cl-feed-card__modal-shell custom:tw-rounded-[7px] tw-rounded-[0px] custom:tw-w-[95%] custom:tw-h-[95%] tw-w-[100%] tw-h-[100%] custom:tw-max-h-[800px] tw-max-h-full tw-flex tw-flex-row tw-flex-wrap ${
            post.is_shared || post.references.length === 0
              ? ""
              : "custom:tw-overflow-hidden"
          } tw-overflow-auto ${
            window.innerWidth >= 842 ? "x-scroll" : "t-scroll"
          }`}
        >
          {!post.is_shared && (
            <Carousel
              className="tw-bg-[var(--surface-2)] tw-w-full tw-h-full tw-flex-1 tw-min-w-[350px]"
              showIndicators={false}
              showThumbs={false}
            >
              {post.references.map((mpr: IReference) => {
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
              post.references.length > 0
                ? post.is_shared
                  ? "custom:tw-max-w-full"
                  : "custom:tw-max-w-[400px]"
                : "custom:tw-max-w-full"
            } tw-min-w-[350px] cl-feed-card__modal-side tw-flex-col tw-pb-[10px] ${
              post.is_shared || post.references.length === 0
                ? ""
                : "custom:tw-h-full"
            }`}
          >
            <div className="tw-w-[calc(100%-0px)] tw-p-[25px] tw-flex tw-justify-between">
              <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
                <Avatar
                  id={post.entity.details?.slug ?? post.entity.details.username}
                  name={
                    post.entity.details?.name ??
                    `${post.entity.details.first_name} ${post.entity.details.last_name}`
                  }
                  src={
                    post.entity.details.profile
                      ? post.entity.details.profile !== "none"
                        ? post.entity.details.profile
                        : undefined
                      : post.entity.details.profile !== "none"
                        ? post.entity.details.profile
                        : undefined
                  }
                  size={35}
                />
                <div className="tw-flex tw-flex-col tw-items-start tw-gap-[2px]">
                  <div className="tw-text-left tw-flex tw-flex-wrap tw-items-center">
                    <span
                      className="cl-feed-card__title tw-break-keep tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
                      onClick={() => {
                        if (post.entity.type !== "user") {
                          navigate(`/${post.entity.details.slug}`);
                          return;
                        }

                        navigate(`/${post.entity.details.username}`);
                      }}
                    >
                      {post.entity.type !== "user" ? (
                        <div className="tw-flex tw-items-center tw-gap-[4px]">
                          <span>{post.entity.details.name}</span>
                          {post.entity.details.is_verified && (
                            <RiVerifiedBadgeFill
                              size={16}
                              color="var(--brand)"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="tw-flex tw-items-center tw-gap-[4px]">
                          <span>
                            {post.entity.details.first_name}
                            {post.entity.details.middle_name == "N/A"
                              ? ""
                              : ` ${post.entity.details.middle_name}`}{" "}
                            {post.entity.details.last_name}
                          </span>
                          {post.entity.details.is_badged && (
                            <RiVerifiedBadgeFill
                              size={16}
                              color="var(--brand)"
                            />
                          )}
                        </div>
                      )}
                    </span>
                    &nbsp;
                    {post.tagging.length > 0 && (
                      <TaggingSummary tagging={post.tagging} />
                    )}
                  </div>
                  <span className="tw-text-[12px]">{dateposted}</span>
                </div>
              </div>
              {authentication.auth && (
                <PostOptions
                  post={post}
                  onProcess={() => {}}
                  onFinish={(type: string) => {
                    switch (type) {
                      case "deleted":
                        setPost((prev) => {
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
                        setPost((prev) => {
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
                        setPost((prev) => {
                          if (prev) {
                            return {
                              ...prev,
                              is_archived: false,
                            };
                          }

                          return prev;
                        });
                        break;
                      default:
                        break;
                    }
                    onOptionFinish?.(type);
                  }}
                  onError={() => {}}
                />
              )}
              <button
                onClick={onClose}
                className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
              >
                <IoMdClose style={{ fontSize: "17px", color: "var(--text)" }} />
              </button>
            </div>
            <div
              className={`tw-w-[calc(100%-0px)] tw-pl-[25px] tw-pr-[25px] tw-flex tw-flex-col tw-items-center tw-gap-[10px] tw-min-h-[35px] tw-justify-center`}
            >
              <div
                ref={textContainerRef}
                className={`tw-w-full tw-flex tw-justify-center ${
                  minimizedCaption ? "tw-max-h-[120px]" : "tw-max-h-none"
                } tw-overflow-y-hidden`}
              >
                <span ref={textRef} className={`tw-text-[14px] tw-text-left c1`}>
                  {post.caption}
                </span>
              </div>
              {/* Same renderer the profile feed uses, so a link in a post
                  shows its preview card here instead of a bare URL. */}
              {post.link_preview && (
                <LinkPreviewCard preview={post.link_preview} variant="display" />
              )}
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
              {!minimizedCaption && post.caption.length >= 600 && (
                <button
                  onClick={() => {
                    setminimizedCaption(true);
                  }}
                  className={`cl-feed-card__toggle tw-text-[12px] tw-text-left tw-bg-transparent tw-p-[5px] tw-border-none tw-cursor-pointer tw-rounded-[4px]`}
                >
                  See less
                </button>
              )}
              {post.is_shared &&
                post.references.map((mpu: any, i: number) => {
                  return <LoadedPostItem key={i} postID={mpu.reference} />;
                })}
            </div>
            <div className="tw-w-[calc(100%-0px)] tw-pl-[25px] tw-pr-[25px] tw-mt-[10px] tw-pb-[5px]">
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
                    {post.preview
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
                          {shareCount} {shareCount === 1 ? " share" : " shares"}
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
                        post_id={post.post_id}
                        reaction={post.entity_reaction}
                        onProcessEmojiSelection={onProcessEmojiSelection}
                        onSuccessEmojiSelection={onSuccessEmojiSelection}
                      />
                    </motion.div>
                    {post.entity_reaction ? (
                      <div className="tw-text-[25px] tw-flex-1 tw-justify-center tw-items-center -tw-mt-[6px]">
                        {emojilist.length > 0 &&
                          (emojilist.filter(
                            (flt: Emoji) =>
                              flt.emoji_id === post.entity_reaction,
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
                    onClick={onShare}
                    className="cl-feed-card__action tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer tw-rounded-[5px]"
                  >
                    <PiShareFat
                      style={{ fontSize: "25px", color: "var(--text-2)" }}
                    />
                  </button>
                  {postOwnerUserID === authentication.user.entity_id && (
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
                post.is_shared
                  ? "custom:tw-overflow-y-hidden"
                  : "custom:tw-overflow-y-auto"
              }
            >
              <PostComment post_id={post.post_id} parent_id={null} />
            </div>
          </div>
        </div>
      }
    />
  );
}

export default PostPreviewModal;
