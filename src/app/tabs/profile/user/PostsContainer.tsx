/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  IPost,
  ProfileUserInfoInterface,
} from "@/reusables/vars/interfaces";
import { Fragment, useEffect, useRef, useState } from "react";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import PostItem from "./PostItem";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import { FaFileAlt } from "react-icons/fa";
import { motion, useInView } from "framer-motion";
import {
  GetFeedEmojisRequest,
  GetPostRequest,
} from "@/reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { postsliststate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import { SET_EMOJIS_LIST } from "@/redux/types";
import { Card } from "@/reusables/design";
import ProfileComposerContent from "@/app/reusables/ProfileComposerContent";
import type { CommunityCard } from "@/reusables/hooks/communityRequests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";

export interface PostsContainerProps {
  profileInfo?: ProfileUserInfoInterface;
  community?: CommunityCard;
  hideComposer?: boolean;
  onCommunityAccessDenied?: (error: unknown) => void;
}

function PostsContainer({
  profileInfo,
  community,
  hideComposer = false,
  onCommunityAccessDenied,
}: PostsContainerProps) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const params = useParams();
  const actor =
    authentication.active_entity_context?.id ?? authentication.user.entity_id;
  const communityScope = community
    ? JSON.stringify([
        community.realm_id,
        actor,
        community.is_member,
        community.is_private,
      ])
    : "";
  const scopeRef = useRef(communityScope);
  const previousCommunityScope = useRef(communityScope);
  scopeRef.current = communityScope;
  const accessDeniedRef = useRef(onCommunityAccessDenied);
  accessDeniedRef.current = onCommunityAccessDenied;
  const [communityPaging, setCommunityPaging] = useState({
    scope: communityScope,
    page: 1,
    revision: 0,
  });
  const communityPage =
    communityPaging.scope === communityScope ? communityPaging.page : 1;
  const communityRevision =
    communityPaging.scope === communityScope ? communityPaging.revision : 0;
  const [loadedCommunityScope, setLoadedCommunityScope] = useState(communityScope);
  const [deniedCommunityScope, setDeniedCommunityScope] = useState<string | null>(
    null,
  );
  const [communityError, setCommunityError] = useState({ scope: "", message: "" });
  const loadError = communityError.scope === communityScope ? communityError.message : "";
  const canReadCommunity = !community?.is_private || community.is_member;
  const communityAccessDenied = deniedCommunityScope === communityScope;

  const [createposttext, setcreateposttext] = useState<string>("");
  const [page, setpage] = useState<number>(1);
  const [range] = useState<number>(20);

  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const [ispostsloaded, setispostsloaded] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [paginatedPosts, setpaginatedPosts] =
    useState<PaginationProp<IPost>>(postsliststate);
  const visiblePosts =
    community &&
    (loadedCommunityScope !== communityScope ||
      !canReadCommunity ||
      communityAccessDenied)
      ? postsliststate
      : paginatedPosts;
  const posts: IPost[] = visiblePosts.results;

  const dispatch = useDispatch();

  const GetEmojisProcess = () => {
    GetFeedEmojisRequest()
      .then((response) => {
        dispatch({
          type: SET_EMOJIS_LIST,
          payload: {
            emojis: response,
          },
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const GetPostProcess = () => {
    if (community) {
      setCommunityPaging((previous) => ({
        scope: communityScope,
        page: 1,
        revision: previous.revision + 1,
      }));
      return;
    }
    setIsLoadingMore(true);
    GetPostRequest({
      current_user_id: authentication.user.entity_id,
      userID: params.userID,
      page: page,
      range: range,
    })
      .then((response) => {
        setpaginatedPosts((prev) => {
          const combinedList = [...prev.results, ...response.results];
          const uniqueById = combinedList
            .filter(
              (obj, index, self) =>
                index === self.findIndex((t) => t.post_id === obj.post_id),
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.date_posted).getTime() -
                new Date(a.date_posted).getTime(),
            );

          return {
            ...response,
            results: uniqueById,
          };
        });
        setispostsloaded(true);
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1500);
      })
      .catch((err) => {
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1500);
        console.log(err);
      });
  };

  useEffect(() => {
    if (!community) setispostsloaded(false);
  }, [profileInfo, params.userID]);

  useEffect(() => {
    GetEmojisProcess();
  }, []);

  useEffect(() => {
    if (!community) GetPostProcess();
  }, [params.userID, page, profileInfo]);

  useEffect(() => {
    if (community) return;
    setpage(1);

    return () => {
      setpaginatedPosts(postsliststate);
    };
  }, [params.userID]);

  useEffect(() => {
    if (!community || !canReadCommunity) return;
    let active = true;
    const scope = communityScope;
    const isCurrent = () => active && scopeRef.current === scope;
    setCommunityError({ scope, message: "" });
    if (communityPage === 1) {
      setpaginatedPosts(postsliststate);
      setispostsloaded(false);
    }
    setLoadedCommunityScope(scope);
    setDeniedCommunityScope(null);
    setIsLoadingMore(true);
    GetPostRequest({
      current_user_id: actor,
      userID: community.realm_id,
      page: communityPage,
      range,
    })
      .then((response) => {
        if (!isCurrent()) return;
        setpaginatedPosts((previous) => {
          const rows: IPost[] =
            communityPage === 1
              ? response.results
              : [...previous.results, ...response.results];
          return {
            ...response,
            results: rows.filter(
              (post, index) =>
                rows.findIndex((row) => row.post_id === post.post_id) === index,
            ),
          };
        });
        setispostsloaded(true);
      })
      .catch((error) => {
        if (!isCurrent()) return;
        setCommunityError({ scope, message: "failed" });
        const status = error?.response?.status ?? error?.status;
        if (status === 403 || status === 404) {
          setpaginatedPosts(postsliststate);
          setDeniedCommunityScope(scope);
          settoggleNewPostModal({ toggle: false, withImage: false });
          accessDeniedRef.current?.(error);
        } else {
          notifyRequestError(error, "Posts could not be loaded.");
        }
        setispostsloaded(true);
      })
      .finally(() => {
        if (isCurrent()) setIsLoadingMore(false);
      });
    return () => {
      active = false;
    };
  }, [communityScope, communityPage, communityRevision]);

  useEffect(() => {
    if (!community) return;
    if (previousCommunityScope.current === communityScope) return;
    previousCommunityScope.current = communityScope;
    settoggleNewPostModal({ toggle: false, withImage: false });
    setcreateposttext("");
  }, [communityScope]);

  const loaderRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(loaderRef, {
    amount: 1,
  });

  useEffect(() => {
    if (isInView && visiblePosts.next && !isLoadingMore && !loadError) {
      if (community)
        setCommunityPaging({
          scope: communityScope,
          page: communityPage + 1,
          revision: communityRevision,
        });
      else
        setpage((prev) => prev + 1);
    }
  }, [isInView, visiblePosts.next, isLoadingMore, loadError]);

  const showComposer =
    authentication.auth &&
    !hideComposer &&
    (community ? community.is_member && !communityAccessDenied : !!profileInfo);
  const showEmptyState = community
    ? (loadedCommunityScope === communityScope && ispostsloaded) ||
      !canReadCommunity ||
      communityAccessDenied
    : ispostsloaded;

  return (
    <Fragment>
      {showComposer && (
        <Card
          pad={12}
          className="cl-bleed"
          style={{ marginBottom: 8, width: "100%" }}
        >
          {toggleNewPostModal.toggle && (
            <NewPostModal
              toShare={false}
              sharePreviewData={null}
              withImage={toggleNewPostModal.withImage}
              community={community}
              profileInfo={
                community || !profileInfo
                  ? undefined
                  : {
                      id: profileInfo.id,
                      entityID: profileInfo.entityID,
                      username: profileInfo.userID,
                      firstName: profileInfo.fullname?.firstName,
                      middleName: profileInfo.fullname?.middleName,
                      lastName: profileInfo.fullname?.lastName,
                      profile: profileInfo.profile,
                      isBadged: profileInfo.isBadged,
                    }
              }
              otherEntityID={null}
              setcreateposttext={setcreateposttext}
              getpostprocess={GetPostProcess}
              onclose={settoggleNewPostModal}
            />
          )}
          <ProfileComposerContent
            placeholder={
              community
                ? `Share something with ${community.name}…`
                : profileInfo?.userID === authentication.user.username
                  ? "Share your thoughts..."
                  : `Write on ${profileInfo?.fullname.firstName}'s wall...`
            }
            value={createposttext}
            onChange={setcreateposttext}
            onOpen={(withImage) =>
              settoggleNewPostModal({ toggle: true, withImage })
            }
          />
        </Card>
      )}
      {community && loadError && (
        <Card pad={12} className="cl-bleed" style={{ width: "100%", marginBottom: 8 }}>
          <div className="tw-flex tw-flex-col tw-items-start tw-gap-[8px] tw-text-left">
            <button
              className="cl-profile-action-button--secondary cl-text-caption tw-p-[8px] tw-rounded-[12px] tw-cursor-pointer"
              onClick={() => setCommunityPaging({ scope: communityScope, page: communityPage, revision: communityRevision + 1 })}
            >
              Try again
            </button>
          </div>
        </Card>
      )}
      {visiblePosts.count > 0 ? (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[0px] tw-mt-[0px]">
          {posts.map((mp: IPost) => {
            return (
              <Card
                pad={10}
                style={{ marginBottom: 8, width: "100%" }}
                key={mp.post_id}
                className="cl-bleed tw-flex tw-justify-center tw-w-full"
              >
                <PostItem
                  key={mp.post_id}
                  isSharePreview={false}
                  mp={
                    community
                      ? { ...mp, community: { ...mp.community, ...community } }
                      : mp
                  }
                  show_archived={false}
                />
              </Card>
            );
          })}
          {/* {paginatedPosts.next && ( */}
          {/* <div
            ref={loaderRef}
            style={{ display: paginatedPosts.next ? "flex" : "none" }}
            id="divlazyloader"
            className="tw-bg-transparent tw-w-full tw-flex tw-items-center tw-justify-center tw-mt-[5px] tw-mb-[5px]"
          >
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
              <AiOutlineLoading3Quarters style={{ fontSize: "20px" }} />
            </motion.div>
          </div> */}
          {/* )} */}
        </div>
      ) : loadError ? null : showEmptyState ? (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[70px]">
          <FaFileAlt style={{ fontSize: "60px", color: "#333333" }} />
          <div className="tw-flex tw-flex-col tw-gap-[0px] tw-text-[#333333]">
            <span className="tw-font-semibold cl-text-body">No Posts yet</span>
          </div>
        </div>
      ) : (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[0px] tw-mt-[0px]">
          {Array.from({ length: 8 }, (_, i: number) => {
            return (
              <Card
                pad={10}
                style={{ marginBottom: 8, width: "100%" }}
                key={i}
                className="cl-bleed tw-flex tw-justify-center tw-w-full"
              >
                <PostItemLoader key={i} />
              </Card>
            );
          })}
        </div>
      )}
      <motion.div
        ref={loaderRef}
        id="divlazyloader"
        initial={{
          height: visiblePosts.next ? "auto" : "0px",
        }}
        animate={{
          height: visiblePosts.next ? "auto" : "0px",
        }}
        className="tw-bg-transparent tw-w-full tw-flex tw-items-center tw-justify-center tw-mt-[5px] tw-mb-[5px] tw-overflow-y-hidden"
      >
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
          <AiOutlineLoading3Quarters style={{ fontSize: "20px" }} />
        </motion.div>
      </motion.div>
    </Fragment>
  );
}

export default PostsContainer;

