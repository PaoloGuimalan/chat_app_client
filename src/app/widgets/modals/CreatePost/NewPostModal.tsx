/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCommunity, listCommunities, type CommunityCard } from "@/reusables/hooks/communityRequests";
import { selectedCommunity } from "@/reusables/hooks/communityState";
import "../../../../styles/communities.css";
import "../../../../styles/community-destination.css";
import Modal from "@/app/reusables/Modal";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import { pickFiles } from "@/reusables/hooks/pickFiles";
import { useDragAndDrop } from "@/reusables/hooks/useDragAndDrop";
import { useLinkPreview } from "@/reusables/hooks/useLinkPreview";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import { useEffect, useRef, useState } from "react";
import HashtagField from "@/app/reusables/HashtagField";
import {
  PRIVACY_OPTIONS,
  defaultPrivacyStatus,
  findPrivacyOption,
  isPrivateProfile as privacyIsPrivateProfile,
} from "@/reusables/hooks/postPrivacy";
import { BsFileEarmarkPost, BsPinMapFill } from "react-icons/bs";
import {
  FaUserTag,
  FaMagnifyingGlass,
  FaPlus,
  FaCheck,
  FaXmark,
} from "react-icons/fa6";
import { MdAddToPhotos } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import PostMediaPreview from "./PostMediaPreview";
import {
  CreatePostRequest,
  EntitySearchRequest,
  UploadMediaRequest,
} from "@/reusables/hooks/requests";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { BiSolidImageAdd } from "react-icons/bi";
import { PiShareFat } from "react-icons/pi";
import PostItem from "@/app/tabs/profile/user/PostItem";
import {
  AuthenticationInterface,
  EntitySearchResult,
} from "@/reusables/vars/interfaces";
import { Avatar, BotFlag, Icon, PageFlag } from "@/reusables/design";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { limitFor } from "@/reusables/vars/uploads";
import {
  resolveErrorMessage,
  resolveResponseMessage,
} from "@/reusables/hooks/errormessages";

const POST_FAILED = "We couldn't publish that post. Please try again.";

export function NewPostModal({
  toShare,
  community: initialCommunity,
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
  const alerts = useSelector((state: any) => state.alerts);

  const [isuploadingpost, setisuploadingpost] = useState<boolean>(false);
  const [iswithImage, setiswithImage] = useState<boolean>(
    toShare ? false : withImage,
  );

  const [mainpostcaption, setmainpostcaption] = useState<string>("");
  const captionRef = useRef<HTMLTextAreaElement | null>(null);
  const [_, setcurrenttab] = useState<string>("content"); //currenttab
  const [medialist, setmedialist] = useState<any[]>([]);

  // Audience for this post. The default mirrors the server's own rule so the
  // UI shows what will actually happen rather than claiming "Public" and being
  // overridden - see reusables/hooks/postPrivacy.
  const isPrivateProfile = privacyIsPrivateProfile(authentication);
  const [postPrivacy, setpostPrivacy] = useState<string>(() =>
    defaultPrivacyStatus(authentication),
  );
  const [showPrivacy, setshowPrivacy] = useState<boolean>(false);

  const activePrivacy = findPrivacyOption(postPrivacy);

  // Entities selected to tag - users OR realms/pages. We keep the normalized
  // search objects (not just ids) so chips and results render avatars, names
  // and verified badges; entity_id is what gets submitted, since the backend
  // resolves tagging.users against entity_id.
  //
  // Posting on another user's profile pre-tags that profile owner as a
  // removable chip. Skipped on your own feed and when posting as a page/realm.
  const isViewingOtherProfile =
    !!profileInfo?.entityID &&
    authentication?.user?.entity_id != profileInfo?.entityID &&
    !otherEntityID;

  const profileDisplayName = [
    profileInfo?.firstName,
    profileInfo?.middleName && profileInfo?.middleName !== "N/A"
      ? profileInfo?.middleName
      : "",
    profileInfo?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const [taggedEntities, settaggedEntities] = useState<EntitySearchResult[]>(
    isViewingOtherProfile
      ? [
        {
          entity_id: profileInfo.entityID,
          type: "user",
          display_name: profileDisplayName || profileInfo.username || "",
          handle: profileInfo.username || "",
          profile:
            !profileInfo.profile || profileInfo.profile === "none"
              ? null
              : profileInfo.profile,
          is_verified: !!profileInfo.isBadged,
          realm_type: null,
        },
      ]
      : [],
  );
  const [showTagging, setshowTagging] = useState<boolean>(false);
  const [tagsearch, settagsearch] = useState<string>("");
  const [tagresults, settagresults] = useState<EntitySearchResult[]>([]);
  const [istagsearching, setistagsearching] = useState<boolean>(false);
  const dispatch = useDispatch();

  const actor = authentication.active_entity_context?.id ?? authentication.user.entity_id;
  const currentActor = useRef(actor);
  currentActor.current = actor;
  const initialActor = useRef(actor);
  const mounted = useRef(true);
  const submitPending = useRef(false);
  const contextEpoch = useRef(0);
  const [communities, setCommunities] = useState<CommunityCard[]>(initialCommunity ? [initialCommunity] : []);
  const [destination, setDestination] = useState<string>(initialCommunity?.entity_id || "");
  const [anonymous, setAnonymous] = useState(false);
  const [destinationError, setDestinationError] = useState("");
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [showDestination, setShowDestination] = useState(false);
  const community = selectedCommunity(communities, destination);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (actor !== initialActor.current) { contextEpoch.current++; setmedialist([]); setmainpostcaption(""); setAnonymous(false); setDestination(""); onclose(false); }
  }, [actor, onclose]);
  useEffect(() => {
    if (toShare) return;
    let active = true;
    const load = async () => {
      let page = 1; const joined: CommunityCard[] = [];
      do {
        const response = await listCommunities({ joined: true, page, page_size: 100 });
        if (!active) return;
        joined.push(...response.results.filter(card => card.is_member));
        if (!response.next) break;
        page++;
      } while (active);
      if (active) setCommunities(joined);
    };
    load().catch(() => { if (active) setDestinationError("Community destinations could not be refreshed. Try reopening the composer."); });
    const changed = (event: Event) => {
      const realmId = (event as CustomEvent).detail?.realm_id;
      if (!active) return;
      if (!destination || (realmId && realmId !== community?.realm_id)) {
        load().catch(() => {
          if (active) setDestinationError("Community destinations could not be refreshed.");
        });
        return;
      }
      contextEpoch.current++;
      setAccessBlocked(true);
      setmedialist([]);
      setDestinationError("Community access changed. Reopen this composer to continue.");
    };
    document.addEventListener("community-changed", changed);
    return () => { active = false; document.removeEventListener("community-changed", changed); };
  }, [actor, toShare, destination, community?.realm_id]);

  const isTagged = (entity: EntitySearchResult) =>
    taggedEntities.some((tagged) => tagged.entity_id === entity.entity_id);

  const toggleTag = (entity: EntitySearchResult) => {
    settaggedEntities((prev) =>
      prev.some((tagged) => tagged.entity_id === entity.entity_id)
        ? prev.filter((tagged) => tagged.entity_id !== entity.entity_id)
        : [...prev, entity],
    );
  };

  const removeTag = (entity: EntitySearchResult) => {
    settaggedEntities((prev) =>
      prev.filter((tagged) => tagged.entity_id !== entity.entity_id),
    );
  };

  // Debounced people search for the tagging panel. Mirrors SearchMiniDrawer:
  // only fires once the query is non-empty (and not a bare trailing "@").
  useEffect(() => {
    if (!showTagging) return;

    const timeoutRequest = setTimeout(() => {
      if (tagsearch.trim() !== "" && tagsearch.split("@")[1] !== "") {
        EntitySearchRequest(
          { searchdata: tagsearch, types: "user,realm,bot", realmTypes: "page" },
          dispatch,
          setistagsearching,
          alerts,
          settagresults,
        );
      } else {
        setistagsearching(false);
        settagresults([]);
      }
    }, 600);

    setistagsearching(tagsearch.trim() !== "");

    return () => clearTimeout(timeoutRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsearch, showTagging]);

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

    const oversized = files.some((file) => file.size > limitFor("post_media").maxBytes);
    if (oversized) {
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: {
            type: "warning",
            content: `Cannot upload files greater than ${limitFor("post_media").label}`,
          },
        },
      });
    }

    files
      .filter(
        (file) =>
          (file.type.includes("image") || file.type.includes("video")) &&
          file.size <= limitFor("post_media").maxBytes,
      )
      .forEach((file) => {
        setmedialist((prev: any) => [
          ...prev,
          {
            id: prev.length + 1,
            name: file.name,
            reference: URL.createObjectURL(file),
            caption: "",
            referenceMediaType: file.type.includes("image") ? "image" : "video",
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
    if (submitPending.current || accessBlocked || actor !== initialActor.current || (destination && !community)) return;
    if (toShare || mainpostcaption.trim() !== "" || medialist.length > 0) {
      submitPending.current = true;
      setisuploadingpost(true);

      // taggedEntities already includes the auto-tagged profile owner (when
      // posting on someone else's profile), so the submitted list is just their
      // entity_ids, deduped - that's what the backend matches tagging.users on.
      const validatedTaggedList = Array.from(
        new Set(
          taggedEntities.map((entity) => entity.entity_id).filter(Boolean),
        ),
      );

      const submissionEpoch = contextEpoch.current;
      const submissionToken = localStorage.getItem("authtoken") || undefined;
      try {
        if (community) {
          const confirmed = await getCommunity(community.realm_id);
          if (!confirmed.result.is_member) throw new Error("Join this community before posting.");
        }
        if (!mounted.current || currentActor.current !== actor || submissionEpoch !== contextEpoch.current) return;
        let uploadedReferences: any[] = [];

        if (!toShare && medialist.length > 0) {
          const uploadResponse: any = await UploadMediaRequest(
            medialist.map((mp) => ({
              file: mp.file,
              caption: mp.caption,
              referenceMediaType: mp.referenceMediaType,
            })),
            "post",
            undefined,
            community ? { community_entity_id: community.entity_id, is_anonymous: anonymous } : undefined,
            submissionToken,
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

        if (!mounted.current || currentActor.current !== actor || submissionEpoch !== contextEpoch.current) return;
        const response: any = await CreatePostRequest({
          ...(community ? { community_entity_id: community.entity_id, is_anonymous: anonymous } : {}),
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
            status: community ? (community.is_private ? "private" : "public") : postPrivacy,
            users: [], //userID for filteration depending on status
          }, //public, connections, private, custom
          onfeed: "feed",
          otherEntityID: community ? null : otherEntityID,
        });

        if (!mounted.current || currentActor.current !== actor || submissionEpoch !== contextEpoch.current) return;
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
          // A refusal inside a 200 used to close nothing and say nothing -
          // the modal just stopped spinning with the post still unsaved.
          setisuploadingpost(false);
          dispatch({
            type: SET_MUTATE_ALERTS,
            payload: {
              alerts: {
                type: "warning",
                content: resolveResponseMessage(response, POST_FAILED),
              },
            },
          });
        }
      } catch (err: any) {
        if (!mounted.current || currentActor.current !== actor || submissionEpoch !== contextEpoch.current) return;
        console.log(err);
        setisuploadingpost(false);
        dispatch({
          type: SET_MUTATE_ALERTS,
          payload: {
            alerts: {
              type: "warning",
              content: resolveErrorMessage(err, POST_FAILED),
            },
          },
        });
      } finally { submitPending.current = false; }
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
          className={`div_modal_container cl-create-post-shell ${showDestination ? "cl-create-post-shell--destination" : ""} ${toShare
            ? "cl-create-post-shell--share"
            : iswithImage
              ? "cl-create-post-shell--media"
              : ""
            } ${toShare
              ? "tw-max-h-[600px]"
              : iswithImage || showTagging || showPrivacy || showDestination
                ? "tw-max-h-[600px]"
                : "tw-max-h-[290px]"
            }`}
        >
          {isuploadingpost && !toShare && (
            <div
              className={`cl-create-post-loading tw-absolute tw-inset-0 tw-h-full tw-w-full ${toShare
                ? "tw-max-h-[600px]"
                : iswithImage || showTagging || showPrivacy
                  ? "tw-max-h-[520px]"
                  : "tw-max-h-[260px]"
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
              {showDestination ? (
                <button
                  type="button"
                  aria-label="Back to post"
                  className="cl-community-destination-back"
                  onClick={() => setShowDestination(false)}
                >
                  <Icon n="arrow_back" s={20} />
                </button>
              ) : toShare ? (
                <PiShareFat style={{ fontSize: "22px" }} />
              ) : (
                <BsFileEarmarkPost style={{ fontSize: "20px" }} />
              )}
              <span className="span_modal_header_label tw-font-inter tw-text-[var(--text)]">
                {showDestination ? "Post in" : toShare ? "Share Post" : "Create a Post"}
              </span>
            </div>
            {!toShare && !showDestination && (
              <span
                className="cl-community-destination-summary"
                title={`Post in ${community?.name || "Your timeline"} · ${anonymous ? "Anonymous" : "My profile"}`}
              >
                Post in {community?.name || "Your timeline"} · {anonymous ? "Anonymous" : "My profile"}
              </span>
            )}
          </div>
          {/* thinscroller, not `scroller`: the latter renders a 10px bar with
              a #f1f1f1 track, which on the dark theme showed up as a pale
              strip drawn over the caption box's right edge. Every other
              scroll area in this modal already uses thinscroller. */}
          {showDestination ? (
            <>
              <section className="cl-community-destination-page thinscroller" aria-label="Post destination">
                <p>Choose where to share this post.</p>
                <label htmlFor="post-community-destination">Post in</label>
                <select
                  id="post-community-destination"
                  disabled={isuploadingpost || Boolean(initialCommunity)}
                  value={destination}
                  onChange={event => {
                    setDestination(event.target.value);
                    setAnonymous(false);
                    setAccessBlocked(false);
                    setDestinationError("");
                    setshowPrivacy(false);
                  }}
                >
                  <option value="">Your timeline</option>
                  {communities.map(card => <option key={card.entity_id} value={card.entity_id}>{card.name}</option>)}
                </select>
                {community && (
                  <>
                    <label htmlFor="post-community-identity">Post as</label>
                    <select
                      id="post-community-identity"
                      disabled={isuploadingpost}
                      value={anonymous ? "anonymous" : "named"}
                      onChange={event => setAnonymous(event.target.value === "anonymous")}
                    >
                      <option value="named">{authentication.active_entity_context?.name || "My profile"}</option>
                      <option value="anonymous">Anonymous member</option>
                    </select>
                    <p>{community.is_private ? "Private community · Only members can see this post" : "Public community · Anyone can see this post"}</p>
                  </>
                )}
              </section>
              <div className="cl-create-post-actions">
                <button type="button" className="btns_create_cancel" onClick={() => setShowDestination(false)}>Done</button>
              </div>
            </>
          ) : <div className="cl-create-post-body thinscroller tw-w-full tw-items-stretch tw-justify-start">
            {/* pr-[6px] reserves a gutter for the scrollbar. Without it the
                track is drawn ON TOP of the caption box's rounded right edge
                whenever this area scrolls, which it does as soon as a panel
                or a link preview appears. */}
            <div className="tw-w-full tw-flex-1 tw-min-h-0 tw-overflow-y-auto thinscroller tw-bg-transparent tw-flex tw-flex-col tw-gap-[12px] tw-items-stretch tw-pr-[6px]">
              {/* Wrapped so #hashtags colour as they are typed. The textarea
                  itself is untouched - same value, same handlers, same class -
                  because the highlighting is painted behind it rather than
                  replacing it. */}
              <HashtagField value={mainpostcaption} inputRef={captionRef}>
                <textarea
                  ref={captionRef}
                  disabled={isuploadingpost}
                  value={mainpostcaption}
                  onChange={(e) => {
                    setcreateposttext(e.target.value);
                    setmainpostcaption(e.target.value);
                  }}
                  className="cl-create-post-textarea tw-font-inter thinscroller tw-font-Inter"
                  placeholder="Type your caption"
                />
              </HashtagField>
              {!toShare &&
                linkPreview.status === "ok" &&
                linkPreview.preview && (
                  <LinkPreviewCard
                    preview={linkPreview.preview}
                    variant="composer"
                    onRemove={linkPreview.dismiss}
                  />
                )}
              {taggedEntities.length > 0 && (
                <div className="cl-tag-chips">
                  {taggedEntities.map((entity) => (
                    <span className="cl-tag-chip" key={entity.entity_id}>
                      <Avatar
                        id={entity.entity_id}
                        entityId={entity.entity_id}
                        name={entity.display_name}
                        src={entity.profile ?? undefined}
                        size={20}
                        kind={entity.type}
                        shape={entity.type === "user" ? "circle" : "rounded"}
                      />
                      <span className="cl-tag-chip__name">
                        {entity.display_name}
                      </span>
                      {entity.is_verified && (
                        <RiVerifiedBadgeFill
                          size={13}
                          color="var(--brand)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <PageFlag realmType={entity.realm_type} size={12} />
                      <BotFlag type={entity.type} size={12} />
                      <button
                        type="button"
                        disabled={isuploadingpost}
                        onClick={() => removeTag(entity)}
                        title="Remove tag"
                      >
                        <FaXmark style={{ fontSize: "12px" }} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {showPrivacy && !community && (
                <div className="cl-create-post-tagging">
                  <span className="cl-text-caption tw-text-left tw-text-[var(--text-2)]">
                    Who can see this post?
                  </span>
                  <div className="cl-post-privacy-options">
                    {PRIVACY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isuploadingpost}
                        aria-pressed={postPrivacy === option.value}
                        onClick={() => {
                          setpostPrivacy(option.value);
                          setshowPrivacy(false);
                        }}
                        className={`cl-post-privacy-option ${postPrivacy === option.value
                          ? "cl-post-privacy-option--active"
                          : ""
                          }`}
                      >
                        <span className="cl-post-privacy-option__icon">
                          {option.icon}
                        </span>
                        <span className="cl-post-privacy-option__text">
                          <span className="cl-post-privacy-option__label">
                            {option.label}
                          </span>
                          <span className="cl-post-privacy-option__hint">
                            {option.hint}
                          </span>
                        </span>
                        {postPrivacy === option.value && (
                          <FaCheck
                            style={{ fontSize: "13px", flexShrink: 0 }}
                            color="var(--brand)"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  {isPrivateProfile && postPrivacy === "public" && (
                    <span className="cl-text-caption tw-text-left tw-text-[var(--text-2)]">
                      Your profile is private, but this post will be visible to
                      everyone.
                    </span>
                  )}
                </div>
              )}
              {showTagging && (
                <div className="cl-create-post-tagging">
                  <div className="cl-tag-search">
                    <FaMagnifyingGlass style={{ fontSize: "14px" }} />
                    <input
                      autoFocus
                      disabled={isuploadingpost}
                      value={tagsearch}
                      onChange={(e) => settagsearch(e.target.value)}
                      placeholder="Search people, pages or bots to tag"
                    />
                  </div>
                  <div className="cl-tag-results thinscroller">
                    {istagsearching ? (
                      <div className="cl-tag-loading">
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          id="div_loader_tag_search"
                        >
                          <AiOutlineLoading3Quarters
                            style={{ fontSize: "20px" }}
                          />
                        </motion.div>
                      </div>
                    ) : tagresults.length > 0 ? (
                      tagresults.map((entity) => {
                        const selected = isTagged(entity);
                        return (
                          <button
                            type="button"
                            key={entity.entity_id}
                            disabled={isuploadingpost}
                            onClick={() => toggleTag(entity)}
                            className={`cl-tag-result ${selected ? "cl-tag-result--active" : ""
                              }`}
                          >
                            <Avatar
                              id={entity.entity_id}
                              entityId={entity.entity_id}
                              name={entity.display_name}
                              src={entity.profile ?? undefined}
                              size={34}
                              kind={entity.type}
                              shape={
                                entity.type === "user" ? "circle" : "rounded"
                              }
                            />
                            <div className="cl-tag-result__meta">
                              <span className="cl-tag-result__title">
                                <span className="cl-tag-result__name">
                                  {entity.display_name}
                                </span>
                                {entity.is_verified && (
                                  <RiVerifiedBadgeFill
                                    size={14}
                                    color="var(--brand)"
                                    style={{ flexShrink: 0 }}
                                  />
                                )}
                                <PageFlag
                                  realmType={entity.realm_type}
                                  size={14}
                                />
                                <BotFlag type={entity.type} size={14} />
                              </span>
                              <span className="cl-tag-result__handle">
                                {entity.type === "realm"
                                  ? `${entity.handle}${entity.realm_type
                                    ? ` · ${entity.realm_type}`
                                    : " · page"
                                  }`
                                  : `@${entity.handle}`}
                              </span>
                            </div>
                            <span className="cl-tag-result__action">
                              {selected ? (
                                <FaCheck style={{ fontSize: "13px" }} />
                              ) : (
                                <FaPlus style={{ fontSize: "13px" }} />
                              )}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="cl-tag-empty">
                        {tagsearch.trim() === ""
                          ? "Search for people, pages or bots to tag in this post"
                          : "No results found"}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {iswithImage && (
                <div className="cl-create-post-attachments">
                  {medialist.length > 0 ? (
                    <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px]">
                      {medialist
                        .sort(function(a, b) {
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
                        className={`cl-create-post-dropzone tw-w-full tw-select-none tw-cursor-pointer tw-flex tw-flex-1 tw-flex-row tw-gap-[12px] tw-min-h-[70px] tw-border-dashed tw-items-center tw-justify-center ${isDraggingMedia ? "tw-border-[var(--brand)]" : ""
                          }`}
                      >
                        <MdAddToPhotos
                          style={{ fontSize: "20px", color: "var(--text-2)" }}
                        />
                        <span className="cl-text-body tw-font-semibold tw-text-[var(--text-2)]">
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
                      className={`cl-create-post-dropzone cl-create-post-dropzone--stacked tw-w-full tw-select-none tw-cursor-pointer tw-flex tw-flex-1 tw-flex-col tw-gap-[12px] tw-min-h-[220px] tw-border-dashed tw-items-center tw-justify-center ${isDraggingMedia ? "tw-border-[var(--brand)]" : ""
                        }`}
                    >
                      <MdAddToPhotos
                        style={{ fontSize: "60px", color: "var(--text-2)" }}
                      />
                      <span className="cl-text-body tw-font-semibold tw-text-[var(--text-2)]">
                        {isDraggingMedia
                          ? "Drop to attach"
                          : "Drag & drop photos or videos here"}
                      </span>
                      {!isDraggingMedia && (
                        <span className="cl-text-caption tw-font-normal tw-text-[var(--text-2)]">
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
          }
          {destinationError && <p role="alert" className="cl-community-destination-error">{destinationError}</p>}
          {!showDestination && <div className="cl-create-post-toolbar">
            <button
              onClick={() => {
                setcurrenttab("privacy");
                // Only one panel at a time - they share the composer's scroll
                // area, and stacking them pushes the caption box out of view.
                setshowTagging(false);
                if (!community) setshowPrivacy((prev) => !prev);
              }}
              title={community ? "Audience is determined by the community" : `Audience: ${activePrivacy.label}`}
              className={`cl-tag-toolbar-btn tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--brand-700)] ${showPrivacy ? "cl-toolbar-btn--active" : ""
                }`}
            >
              {/* The icon tracks the current audience (globe / group / lock)
                  so the selection is readable without a text label - the
                  toolbar is icon-only and has no room for one. */}
              {activePrivacy.icon}
            </button>
            {!toShare && (
              <button
                type="button"
                aria-label="Post in"
                title={`Post in: ${community?.name || "Your timeline"}${anonymous ? " · Anonymous" : ""}`}
                disabled={isuploadingpost}
                className="cl-tag-toolbar-btn tw-text-[var(--brand)]"
                onClick={() => setShowDestination(true)}
              >
                <Icon n="groups" s={24} />
              </button>
            )}
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
                setshowPrivacy(false);
                setshowTagging((prev) => !prev);
              }}
              title="Tag people or pages"
              className={`cl-tag-toolbar-btn tw-relative tw-cursor-pointer tw-text-[var(--green)] ${showTagging ? "cl-toolbar-btn--active" : ""
                }`}
            >
              <FaUserTag style={{ fontSize: "20px" }} />
              {taggedEntities.length > 0 && (
                <span className="cl-tag-count">{taggedEntities.length}</span>
              )}
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
          }
          {!showDestination && <div id="div_create_cancel_btns" className="cl-create-post-actions">
            <button
              disabled={isuploadingpost || accessBlocked || (!toShare && !mainpostcaption.trim() && medialist.length === 0) || Boolean(destination && !community)}
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
          </div>}
        </div>
      }
    />
  );
}
