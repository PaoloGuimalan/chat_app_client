/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  AuthenticationInterface,
  IPost,
  IRealmProfileInfo,
} from "@/reusables/vars/interfaces";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { Fragment, useEffect, useRef, useState } from "react";
import ProfileCoverContainer from "./ProfileCoverContainer";
import ProfilePicContainer from "./ProfilePicContainer";
import { motion } from "framer-motion";
import { PaginationProp } from "@/reusables/vars/props";
import { postsliststate } from "@/redux/actions/states";
import PostItem from "./PostItem";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import { FaFileAlt } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { FcAddImage } from "react-icons/fc";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { useSelector } from "react-redux";
import {
  FollowRealmRequest,
  GetPostRequest,
  UnfollowRealmRequest,
} from "@/reusables/hooks/requests";
import { MdPerson } from "react-icons/md";

function RealmProfile({
  realmInfo,
  GetProfileInfoProcess,
}: {
  realmInfo: IRealmProfileInfo;
  GetProfileInfoProcess: (callback: () => void) => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const navigate = useNavigate();

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

  const [paginatedPosts, setpaginatedPosts] =
    useState<PaginationProp<IPost>>(postsliststate);
  const posts: IPost[] = paginatedPosts.results;
  const [ispostsloaded, setispostsloaded] = useState<boolean>(false); // must be false when actual
  const [createposttext, setcreateposttext] = useState<string>("");
  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const [isConnectionButtonsLoading, setisConnectionButtonsLoading] =
    useState<boolean>(false);

  const [page, setpage] = useState<number>(1);
  const [range] = useState<number>(20);

  const params = useParams();

  useEffect(() => {
    let currentView = false;
    if (divcontentRef) {
      if (divcontentRef.current) {
        divcontentRef.current.onscroll = () => {
          // console.log("Hello")
          if (divlazyloaderRef && divlazyloaderRef.current) {
            const top = divlazyloaderRef.current.getBoundingClientRect().top;
            const isVisible = top + 0 >= 0 && top - 0 <= window.innerHeight;
            // const isVisible = top > 0 ? true : false;
            // console.log((top + 0) >= 0 && (top - 0) <= window.innerHeight);
            if (currentView != isVisible) {
              currentView = isVisible;
              if (currentView) {
                // setrange((prev) => prev + 20);
                setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }
  }, [divcontentRef, divlazyloaderRef, realmInfo]);

  const GetPostProcess = () => {
    GetPostRequest({
      current_user_id: authentication.user.userID,
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
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  const FollowRealmProcess = () => {
    setisConnectionButtonsLoading(true);
    FollowRealmRequest({ realm_id: realmInfo.id })
      .then((response) => {
        GetProfileInfoProcess(() => {
          setisConnectionButtonsLoading(false);
        });
        console.log(response);
      })
      .catch((err) => {
        setisConnectionButtonsLoading(false);
        console.log(err);
      });
  };

  const UnfollowRealmProcess = () => {
    setisConnectionButtonsLoading(true);
    UnfollowRealmRequest({ realm_id: realmInfo.id })
      .then((response) => {
        GetProfileInfoProcess(() => {
          setisConnectionButtonsLoading(false);
        });
        console.log(response);
      })
      .catch((err) => {
        setisConnectionButtonsLoading(false);
        console.log(err);
      });
  };

  useEffect(() => {
    GetPostProcess();
  }, [params.userID, page, realmInfo]);

  return (
    <div
      ref={divcontentRef}
      className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll"
    >
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[10] tw-shadow-lg tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px" }} />
      </button>
      <div className="tw-bg-white tw-w-full tw-h-[40%] tw-min-h-[500px] tw-border-solid tw-border-[0px] tw-border-b-[0px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-center tw-items-center">
        <ProfileCoverContainer
          userID={realmInfo.id}
          coverphoto={realmInfo.cover_photo}
          getpostprocess={() => {}}
        />
        <div className="tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1200px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[40px] tw-pr-[40px]">
          <ProfilePicContainer
            userID={realmInfo.id}
            profile={realmInfo.profile}
            getpostprocess={() => {}}
          />
          <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
            <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[20px] tw-sm:p-[0px]">
              <span className="tw-text-[25px] tw-font-bold tw-flex tw-items-center tw-gap-[5px]">
                <span>{realmInfo.name}</span>
                {realmInfo.is_verified && (
                  <RiVerifiedBadgeFill size={18} color="#1c7def" />
                )}
              </span>
              <span className="tw-text-[14px] tw-break-all tw-mb-[20px]">
                {realmInfo.email}
              </span>
              <span className="tw-text-[14px] tw-break-all">
                @{realmInfo.slug}
              </span>
            </div>
            <div className="tw-flex sm:tw-w-auto tw-w-full sm:tw-pb-[0px] tw-pb-[20px] tw-gap-[4px] tw-justify-center">
              {realmInfo.is_admin && (
                <button
                  onClick={() => {
                    navigate(`/realms/${realmInfo.realm_id}`);
                  }}
                  className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-[1px] tw-border-solid tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-white tw-text-[#1c7def] tw-border-[#1c7def] tw-rounded-[6px] tw-text-[12px]"
                >
                  Manage
                </button>
              )}
              {realmInfo.is_follower ? (
                <button
                  onClick={UnfollowRealmProcess}
                  disabled={isConnectionButtonsLoading}
                  className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-[#1c7def] tw-border-[1px] tw-border-solid tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-white tw-text-[#1c7def] tw-rounded-[6px] tw-text-[12px]"
                >
                  {isConnectionButtonsLoading ? (
                    <motion.div
                      animate={{
                        rotate: -360,
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      id="div_loader_request_nano_light"
                    >
                      <AiOutlineLoading3Quarters
                        style={{ fontSize: "15px", color: "#1c7def" }}
                      />
                    </motion.div>
                  ) : (
                    <div className="tw-min-w-[80px]">Unfollow</div>
                  )}
                </button>
              ) : (
                <button
                  onClick={FollowRealmProcess}
                  disabled={isConnectionButtonsLoading}
                  className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-rounded-[6px] tw-text-[12px]"
                >
                  {isConnectionButtonsLoading ? (
                    <motion.div
                      animate={{
                        rotate: -360,
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      id="div_loader_request_nano_light"
                    >
                      <AiOutlineLoading3Quarters style={{ fontSize: "15px" }} />
                    </motion.div>
                  ) : (
                    <div className="tw-min-w-[80px]">Follow</div>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="tw-bg-transparent tw-max-w-[1200px] tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-center md:tw-items-start">
        <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
          <div className="tw-w-full tw-h-fit tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex tw-flex-col">
            <div
              className={`tw-w-[calc(100%-40px)] tw-p-[20px] tw-flex tw-flex-col ${realmInfo.description && realmInfo.description.length >= 600 ? "tw-items-start" : "tw-items-center"} tw-gap-[15px]`}
            >
              <span className="tw-text-[14px]">{realmInfo.description}</span>
            </div>
            <hr className="tw-w-[calc(100%-40px)] tw-text-[#666666] tw-border-white tw-opacity-[0.4] tw-mb-[0px] tw-z-[0]" />
            <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
              <span className="tw-text-[14px] tw-flex tw-items-center">
                <MdPerson
                  size={22}
                  color="#666666"
                  style={{ marginRight: "5px" }}
                />
                {realmInfo.followers_count > 0 ? (
                  <Fragment>
                    Followed by&nbsp;
                    <span className="tw-font-semibold">
                      {realmInfo.followers_count} people
                    </span>
                  </Fragment>
                ) : (
                  "No followers yet"
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-pb-[20px] tw-flex tw-flex-col tw-items-center">
          {toggleNewPostModal.toggle && realmInfo.is_admin && (
            <NewPostModal
              toShare={false}
              sharePreviewData={null}
              withImage={toggleNewPostModal.withImage}
              profileInfo={authentication.user}
              realmInfo={realmInfo}
              setcreateposttext={setcreateposttext}
              getpostprocess={GetPostProcess}
              onclose={settoggleNewPostModal}
            />
          )}
          {realmInfo.is_admin && (
            <Fragment>
              <div
                id="div_feed_header_post_input_profile"
                className="tw-border-[0px]"
              >
                {realmInfo.profile && realmInfo.profile !== "none" ? (
                  <div id="img_default_profile_container">
                    <CachedImage
                      src={realmInfo.profile}
                      id="img_actual_profile"
                    />
                  </div>
                ) : (
                  <div id="div_img_feed_header_container">
                    <CachedImage src={DefaultProfile} id="img_feed_header" />
                  </div>
                )}
                <div id="div_input_feed_flex">
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
                    placeholder="Publish a post"
                    id="input_feed_box"
                  />
                </div>
                <div id="div_btn_image_container">
                  <button
                    onClick={() => {
                      settoggleNewPostModal({ toggle: true, withImage: true });
                    }}
                    id="btn_image_feed"
                  >
                    <FcAddImage style={{ fontSize: "35px" }} />
                  </button>
                </div>
              </div>
            </Fragment>
          )}
          {paginatedPosts.count > 0 ? (
            <div
              className={`tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] ${realmInfo.is_admin ? "tw-mt-[10px]" : "tw-mt-[0px]"}`}
            >
              {posts.map((mp: IPost) => {
                return (
                  <PostItem key={mp.post_id} isSharePreview={false} mp={mp} />
                );
              })}
              {paginatedPosts.next && (
                <div
                  ref={divlazyloaderRef}
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
                </div>
              )}
            </div>
          ) : ispostsloaded ? (
            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[70px]">
              <FaFileAlt style={{ fontSize: "60px", color: "#333333" }} />
              <div className="tw-flex tw-flex-col tw-gap-[0px] tw-text-[#333333]">
                <span className="tw-font-semibold tw-text-[14px]">
                  No Posts yet
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px]  ${realmInfo.is_admin ? "tw-mt-[10px]" : "tw-mt-[0px]"}`}
            >
              {Array.from({ length: 8 }, (_, i: number) => {
                return <PostItemLoader key={i} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RealmProfile;
