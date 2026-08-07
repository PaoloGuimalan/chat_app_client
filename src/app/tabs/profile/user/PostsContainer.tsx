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
import { Avatar, Btn, Card, Icon } from "@/reusables/design";

function PostsContainer({
  profileInfo,
  hideComposer = false,
}: {
  profileInfo: ProfileUserInfoInterface;
  hideComposer?: boolean;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const params = useParams();

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
  const posts: IPost[] = paginatedPosts.results;

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
    setispostsloaded(false);
  }, [profileInfo, params.userID]);

  useEffect(() => {
    GetEmojisProcess();
  }, []);

  useEffect(() => {
    GetPostProcess();
  }, [params.userID, page, profileInfo]);

  useEffect(() => {
    setpage(1);

    return () => {
      setpaginatedPosts(postsliststate);
    };
  }, [params.userID]);

  const loaderRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(loaderRef, {
    amount: 1,
  });

  useEffect(() => {
    if (isInView && paginatedPosts.next && !isLoadingMore)
      setpage((prev) => prev + 1);
  }, [isInView, paginatedPosts.next, isLoadingMore]);

  return (
    <Fragment>
      {authentication.auth && !hideComposer && (
        <Card pad={12} style={{ marginBottom: 8, width: "100%" }}>
          {toggleNewPostModal.toggle && (
            <NewPostModal
              toShare={false}
              sharePreviewData={null}
              withImage={toggleNewPostModal.withImage}
              profileInfo={{
                id: profileInfo.id,
                entityID: profileInfo.entityID,
                username: profileInfo.userID,
                firstName: profileInfo.fullname?.firstName,
                middleName: profileInfo.fullname?.middleName,
                lastName: profileInfo.fullname?.lastName,
                profile: profileInfo.profile,
                isBadged: profileInfo.isBadged,
              }}
              otherEntityID={null}
              setcreateposttext={setcreateposttext}
              getpostprocess={GetPostProcess}
              onclose={settoggleNewPostModal}
            />
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Avatar
              id={profileInfo.userID}
              name={profileInfo.fullname.firstName}
              src={
                profileInfo.profile !== "none" ? profileInfo.profile : undefined
              }
              size={42}
            />
            <input
              type="text"
              autoComplete="off"
              value={createposttext}
              onFocus={() => {
                settoggleNewPostModal({ toggle: true, withImage: false });
              }}
              onChange={(e) => {
                setcreateposttext(e.target.value);
              }}
              onKeyDown={(e) => {
                if (createposttext.trim() !== "") {
                  if (e.key == "Enter") {
                    // CreatePostProcess()
                  }
                }
              }}
              className="tw-font-Inter"
              placeholder={
                profileInfo.userID === authentication.user.username
                  ? "Share your thoughts..."
                  : `Write on ${profileInfo.fullname.firstName}'s wall...`
              }
              style={{
                flex: 1,
                height: 40,
                border: "none",
                outline: "none",
                background: "var(--input)",
                padding: "0 14px",
                borderRadius: 21,
                color: "var(--text)",
                fontSize: "var(--fs-body)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => {
                settoggleNewPostModal({ toggle: true, withImage: true });
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 32,
                padding: "0 10px",
                border: "none",
                background: "transparent",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                color: "var(--text-2)",
                fontSize: "var(--fs-body-sm)",
                fontWeight: 600,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Icon n="image" s={20} c="var(--green)" />
              Photo
            </button>
            <Btn
              size="sm"
              style={{
                marginLeft: "auto",
                opacity: createposttext.trim() ? 1 : 0.7,
              }}
              onClick={() => {
                settoggleNewPostModal({ toggle: true, withImage: false });
              }}
            >
              Post
            </Btn>
          </div>
        </Card>
      )}
      {paginatedPosts.count > 0 ? (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[0px] tw-mt-[0px]">
          {posts.map((mp: IPost) => {
            return (
              <Card
                pad={10}
                style={{ marginBottom: 8, width: "100%" }}
                key={mp.post_id}
                className="tw-flex tw-justify-center tw-w-full"
              >
                <PostItem
                  key={mp.post_id}
                  isSharePreview={false}
                  mp={mp}
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
      ) : ispostsloaded ? (
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
                className="tw-flex tw-justify-center tw-w-full"
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
          height: paginatedPosts.next ? "auto" : "0px",
        }}
        animate={{
          height: paginatedPosts.next ? "auto" : "0px",
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

