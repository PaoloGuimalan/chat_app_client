/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  AuthenticationInterface,
  IPost,
  IRealmProfileInfo,
} from "@/reusables/vars/interfaces";
// import { IoArrowBack } from "react-icons/io5";
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
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { useSelector } from "react-redux";
import { Avatar, Btn, Card, Icon } from "@/reusables/design";
import {
  FollowRealmRequest,
  GetPostRequest,
  UnfollowRealmRequest,
} from "@/reusables/hooks/requests";
import { MdPerson } from "react-icons/md";
import { PiShareFat } from "react-icons/pi";

function RealmProfile({
  realmInfo,
  GetProfileInfoProcess,
  isSharePage = false,
}: {
  realmInfo: IRealmProfileInfo;
  GetProfileInfoProcess: (callback: () => void) => void;
  isSharePage?: boolean;
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
  const realmAvatarSrc: string | undefined =
    realmInfo.profile != null && realmInfo.profile !== "none"
      ? realmInfo.profile
      : undefined;

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
      className="cl-profile-page__shell tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[6px] tw-overflow-y-scroll x-scroll"
      data-share-page={isSharePage ? "true" : "false"}
    >
      {/* <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[10] tw-shadow-lg tw-bg-[var(--surface)] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-full tw-border tw-border-[var(--border)] tw-flex tw-items-center tw-justify-center tw-text-[var(--text)] tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px" }} />
      </button> */}
      {isSharePage && (
        <Card
          pad={12}
          style={{ width: "min(100%, 1200px)", marginTop: 8, marginBottom: 4 }}
        >
          <div className="tw-flex tw-items-center tw-gap-[10px] tw-w-full">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: "var(--brand-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <PiShareFat style={{ fontSize: 18, color: "var(--brand)" }} />
            </div>
            <div className="tw-flex tw-flex-col tw-min-w-0">
              <span className="tw-font-semibold tw-text-[14px] tw-text-[var(--text)]">
                Shared page
              </span>
              <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                View-only preview of this page.
              </span>
            </div>
          </div>
        </Card>
      )}
      <div className="cl-profile-page__hero tw-mb-[6px] tw-w-full tw-h-auto tw-min-h-[auto] sm:tw-min-h-[500px] tw-flex tw-flex-col tw-justify-start sm:tw-justify-center tw-items-center tw-py-[0px] sm:tw-py-[0px]">
        <ProfileCoverContainer
          userID={realmInfo.id}
          realm_id={realmInfo.realm_id}
          coverphoto={realmInfo.cover_photo}
          type="realm"
          isAllowed={realmInfo.is_admin}
          getpostprocess={() => {}}
        />
        <div className="tw-w-[calc(100%-24px)] sm:tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1200px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[12px] tw-pr-[12px] sm:tw-pl-[40px] sm:tw-pr-[40px]">
          <ProfilePicContainer
            userID={realmInfo.id}
            realm_id={realmInfo.realm_id}
            profile={realmInfo.profile}
            type="realm"
            isAllowed={realmInfo.is_admin}
            getpostprocess={() => {}}
          />
          <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
            <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[16px] tw-sm:p-[0px]">
              <span className="tw-text-[25px] tw-font-bold tw-flex tw-items-center tw-gap-[5px]">
                <span>{realmInfo.name}</span>
                {realmInfo.is_verified && (
                  <RiVerifiedBadgeFill size={18} color="var(--brand)" />
                )}
              </span>
              <span className="tw-text-[14px] tw-break-all tw-mb-[14px]">
                {realmInfo.email}
              </span>
              <span className="tw-text-[14px] tw-break-all">
                @{realmInfo.slug}
              </span>
            </div>
            {!authentication.auth && (
              <div className="tw-flex tw-flex-wrap tw-flex-col sm:tw-flex-row tw-items-center sm:tw-w-auto tw-w-full sm:tw-pb-[0px] tw-pb-[20px] tw-gap-[10px]">
                <span className="tw-text-[14px] tw-font-semibold tw-font-Inter">
                  You are not logged in
                </span>
                <button
                  onClick={() => {
                    navigate("/login");
                  }}
                  className="cl-profile-action-button tw-min-w-[100px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
                >
                  Login
                </button>
              </div>
            )}
            {authentication.auth && (
              <div className="tw-flex sm:tw-w-auto tw-w-full sm:tw-pb-[0px] tw-pb-[20px] tw-gap-[4px] tw-justify-center">
                {realmInfo.is_admin && (
                  <button
                    onClick={() => {
                      navigate(`/realms/${realmInfo.realm_id}`);
                    }}
                    className="cl-profile-action-button--secondary tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
                  >
                    Manage
                  </button>
                )}
                {realmInfo.is_follower ? (
                  <button
                    onClick={UnfollowRealmProcess}
                    disabled={isConnectionButtonsLoading}
                    className="cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
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
                          style={{ fontSize: "15px", color: "var(--brand)" }}
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
                    className="cl-profile-action-button tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
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
                          style={{ fontSize: "15px" }}
                        />
                      </motion.div>
                    ) : (
                      <div className="tw-min-w-[80px]">Follow</div>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="cl-profile-page__content tw-bg-transparent tw-max-w-[1200px] tw-w-[calc(100%-24px)] sm:tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[6px] tw-items-stretch md:tw-items-start">
        <div className="cl-profile-page__sidebar tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[8px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
          <div className="cl-profile-surface tw-w-full tw-h-fit tw-flex tw-flex-col">
            <div
              className={`tw-w-[calc(100%-40px)] tw-p-[18px] tw-flex tw-flex-col ${realmInfo.description && realmInfo.description.length >= 600 ? "tw-items-start" : "tw-items-center"} tw-gap-[12px]`}
            >
              <span className="tw-text-[14px]">{realmInfo.description}</span>
            </div>
            <hr className="tw-w-[calc(100%-40px)] tw-border-[var(--border)] tw-opacity-[0.7] tw-mb-[0px] tw-z-[0]" />
            <div className="tw-w-full tw-p-[18px] tw-flex tw-flex-col tw-items-start tw-gap-[12px]">
              <span className="tw-text-[14px] tw-flex tw-items-center">
                <MdPerson
                  size={22}
                  color="var(--text-2)"
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
        <div className="cl-profile-page__feed tw-w-full tw-pb-[16px] tw-flex tw-flex-col tw-items-center tw-gap-[0px]">
          {toggleNewPostModal.toggle && realmInfo.is_admin && (
            <NewPostModal
              toShare={false}
              sharePreviewData={null}
              withImage={toggleNewPostModal.withImage}
              profileInfo={{
                id: authentication.user.userID,
                username: authentication.user.username,
              }}
              realmInfo={realmInfo}
              setcreateposttext={setcreateposttext}
              getpostprocess={GetPostProcess}
              onclose={settoggleNewPostModal}
            />
          )}
          {realmInfo.is_admin && (
            <Fragment>
              <Card pad={14} style={{ marginBottom: 0, width: "100%" }}>
                {toggleNewPostModal.toggle && (
                  <NewPostModal
                    toShare={false}
                    sharePreviewData={null}
                    withImage={toggleNewPostModal.withImage}
                    profileInfo={{
                      id: authentication.user.userID,
                      username: authentication.user.username,
                    }}
                    realmInfo={realmInfo}
                    setcreateposttext={setcreateposttext}
                    getpostprocess={GetPostProcess}
                    onclose={settoggleNewPostModal}
                  />
                )}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar
                    id={realmInfo.slug ?? undefined}
                    name={realmInfo.name ?? ""}
                    src={realmAvatarSrc}
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
                    placeholder="Publish a post"
                    style={{
                      flex: 1,
                      height: 42,
                      border: "none",
                      outline: "none",
                      background: "var(--input)",
                      padding: "0 16px",
                      borderRadius: 21,
                      color: "var(--text)",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 10,
                    paddingTop: 10,
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
                      height: 34,
                      padding: "0 12px",
                      border: "none",
                      background: "transparent",
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      color: "var(--text-2)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--surface-hover)")
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
            </Fragment>
          )}
          {paginatedPosts.count > 0 ? (
            <div
              className={`tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[0px] ${realmInfo.is_admin ? "tw-mt-[10px]" : "tw-mt-[0px]"}`}
            >
              {posts.map((mp: IPost) => {
                return (
                  <Card
                    pad={10}
                    style={{ marginBottom: 8, width: "100%" }}
                    key={mp.post_id}
                    className="tw-flex tw-justify-center tw-w-full"
                  >
                    <PostItem key={mp.post_id} isSharePreview={false} mp={mp} />
                  </Card>
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
              className={`tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[0px]  ${realmInfo.is_admin ? "tw-mt-[10px]" : "tw-mt-[0px]"}`}
            >
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
        </div>
      </div>
    </div>
  );
}

export default RealmProfile;
