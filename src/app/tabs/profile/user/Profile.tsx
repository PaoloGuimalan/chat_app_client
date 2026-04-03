/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  IDiaryPreview,
  IPost,
  ProfileUserInfoInterface,
} from "@/reusables/vars/interfaces";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { IoArrowBack } from "react-icons/io5";
import { TfiThought } from "react-icons/tfi";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AcceptContactRequest,
  ContactRequest,
  DeclineContactRequest,
  GetDiaryTotalRequest,
  GetPostRequest,
} from "@/reusables/hooks/requests";
// import jwtDecode from "jwt-decode";
import { FaBook } from "react-icons/fa6";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaTransgender, FaFileAlt } from "react-icons/fa";
import { IoMale, IoFemale, IoTime } from "react-icons/io5";
// import { IoMdCheckmark } from "react-icons/io";
import { FcAddImage } from "react-icons/fc";
import { MdCake } from "react-icons/md";
import { motion } from "framer-motion";
import {
  formattedDateToWords,
  ordinal_suffix_of,
} from "@/reusables/hooks/reusable";
import PostItem from "./PostItem";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { postsliststate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import {
  SET_CONVERSATION_SETUP,
  SET_MINIMIZED_CONVERSATION,
  SET_TOGGLE_RIGHT_WIDGET,
} from "@/redux/types";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { BiCalendarEdit } from "react-icons/bi";
import { HiOutlinePencil } from "react-icons/hi";
import ProfilePicContainer from "./ProfilePicContainer";
import ProfileCoverContainer from "./ProfileCoverContainer";
import Skeleton from "react-loading-skeleton";
import { RiVerifiedBadgeFill } from "react-icons/ri";

function Profile({
  profileInfo,
  GetProfileInfoProcess,
}: {
  profileInfo: ProfileUserInfoInterface;
  GetProfileInfoProcess: () => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );
  const alerts = useSelector((state: any) => state.alerts);
  const navigate = useNavigate();
  const params = useParams();
  const dispatch = useDispatch();

  const [paginatedPosts, setpaginatedPosts] =
    useState<PaginationProp<IPost>>(postsliststate);
  const posts: IPost[] = paginatedPosts.results;
  const [ispostsloaded, setispostsloaded] = useState<boolean>(false);
  const [isConnectionButtonsLoading, setisConnectionButtonsLoading] =
    useState<boolean>(false);
  const [createposttext, setcreateposttext] = useState<string>("");

  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const [diaryPreview, setDiaryPreview] = useState<IDiaryPreview>({
    isLoaded: false,
    latest_entry: null,
    top_tags: [],
    total_entries: 0,
  });

  const [page, setpage] = useState<number>(1);
  const [range] = useState<number>(20);

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

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
  }, [divcontentRef, divlazyloaderRef, profileInfo]);

  const GetDiaryTotalProcess = () => {
    GetDiaryTotalRequest({
      userID: params.userID,
    })
      .then((response) => {
        setDiaryPreview({ isLoaded: true, ...response });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    setpage(1);
    GetDiaryTotalProcess();

    return () => {
      setpaginatedPosts(postsliststate);
    };
  }, [params.userID]);

  //   useEffect(() => {
  //     GetProfileInfoProcess()
  //   },[])

  const initiateConnectionProcess = (mode: string) => {
    setisConnectionButtonsLoading(true);
    switch (mode) {
      case "add":
        ContactRequest(
          {
            addUsername: profileInfo?.id,
          },
          dispatch,
          alerts,
          (_: boolean) => {
            GetProfileInfoProcess();
            setisConnectionButtonsLoading(false);
          },
        );
        break;
      case "remove":
        DeclineContactRequest(
          {
            connection_id: profileInfo?.connection.connection_id,
            to_user_id: profileInfo?.id,
            action: "remove",
          },
          dispatch,
          alerts,
          (_: boolean) => {
            GetProfileInfoProcess();
            setisConnectionButtonsLoading(false);
          },
        );
        break;
      case "accept":
        AcceptContactRequest(
          {
            connection_id: profileInfo?.connection.connection_id,
            to_user_id: profileInfo?.id,
          },
          dispatch,
          alerts,
          (_: boolean) => {
            GetProfileInfoProcess();
            setisConnectionButtonsLoading(false);
          },
        );
        break;
      case "decline":
        DeclineContactRequest(
          {
            connection_id: profileInfo?.connection.connection_id,
            to_user_id: profileInfo?.id,
            action: "decline",
          },
          dispatch,
          alerts,
          (_: boolean) => {
            GetProfileInfoProcess();
            setisConnectionButtonsLoading(false);
          },
        );
        break;
      case "cancel":
        DeclineContactRequest(
          {
            connection_id: profileInfo?.connection.connection_id,
            to_user_id: profileInfo?.id,
            action: "remove",
          },
          dispatch,
          alerts,
          (_: boolean) => {
            GetProfileInfoProcess();
            setisConnectionButtonsLoading(false);
          },
        );
        break;
      default:
        setisConnectionButtonsLoading(false);
        break;
    }
  };

  const genderIcons: any = {
    Male: <IoMale style={{ fontSize: "20px", color: "#666666" }} />,
    Female: <IoFemale style={{ fontSize: "17px", color: "#666666" }} />,
    Others: <FaTransgender style={{ fontSize: "17px", color: "#666666" }} />,
  };

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
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    setispostsloaded(false);
  }, [profileInfo, params.userID]);

  useEffect(() => {
    GetPostProcess();
  }, [params.userID, page, profileInfo]);

  const settogglerightwidget = (toggle: any) => {
    navigate("/");
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload: {
        togglerightwidget: toggle,
      },
    });
  };

  const navigateToConversation = (
    type: any,
    conversationID: any,
    userdetails: any,
  ) => {
    if (screensizelistener.W <= 1100) {
      if (type == "single") {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: userdetails,
              groupdetails: null,
              type: "single",
            },
          },
        });
        navigate("/messages");
      } else {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: null,
              groupdetails: userdetails,
              type: "group",
            },
          },
        });
        navigate("/messages");
      }
    } else {
      if (type == "single") {
        // dispatch({
        //   type: SET_CONVERSATION_SETUP,
        //   payload: {
        //     conversationsetup: {
        //       conversationid: conversationID,
        //       userdetails: userdetails,
        //       groupdetails: null,
        //       type: "single",
        //     },
        //   },
        // });
        // settogglerightwidget("messages");
        dispatch({
          type: SET_MINIMIZED_CONVERSATION,
          payload: {
            conversation: {
              conversationid: conversationID,
              userdetails: userdetails,
              groupdetails: null,
              type: "single",
            },
          },
        });
      } else {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: null,
              groupdetails: userdetails,
              type: "group",
            },
          },
        });
        settogglerightwidget("messages");
      }
    }
  };

  return profileInfo ? (
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
      <div className="tw-bg-white tw-w-full tw-h-[60%] tw-min-h-[500px] tw-border-solid tw-border-[0px] tw-border-b-[0px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-center tw-items-center">
        <ProfileCoverContainer
          userID={profileInfo.userID}
          coverphoto={profileInfo.coverphoto}
          getpostprocess={GetPostProcess}
        />
        <div className="tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1200px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[40px] tw-pr-[40px]">
          <ProfilePicContainer
            userID={profileInfo.userID}
            profile={profileInfo.profile}
            getpostprocess={GetPostProcess}
          />
          <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
            <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[20px] tw-sm:p-[0px]">
              <span className="tw-text-[25px] tw-font-bold tw-flex tw-items-center tw-gap-[5px]">
                <span>
                  {profileInfo.fullname.firstName}
                  {profileInfo.fullname.middleName == "N/A"
                    ? ""
                    : ` ${profileInfo.fullname.middleName}`}{" "}
                  {profileInfo.fullname.lastName}
                </span>
                {profileInfo.isBadged && (
                  <RiVerifiedBadgeFill size={18} color="#1c7def" />
                )}
              </span>
              <span className="tw-text-[14px] tw-break-all tw-mb-[20px]">
                {profileInfo.email}
              </span>
              <span className="tw-text-[14px] tw-break-all">
                @{profileInfo.userID}
              </span>
            </div>
            {authentication.user.username !== params.userID &&
              profileInfo.connection.is_connection_present !== null && (
                <div className="tw-w-flex sm:tw-w-auto tw-w-full sm:tw-pb-[0px] tw-pb-[20px]">
                  {/* for add friend button */}
                  {!profileInfo.connection.is_connection_present ? (
                    <button
                      disabled={isConnectionButtonsLoading}
                      onClick={() => {
                        initiateConnectionProcess("add");
                      }}
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
                          <AiOutlineLoading3Quarters
                            style={{ fontSize: "15px" }}
                          />
                        </motion.div>
                      ) : (
                        "Add Contact"
                      )}
                    </button>
                  ) : profileInfo.connection.is_connection_handshaked ? (
                    <div className="tw-flex tw-gap-[5px] tw-flex-wrap tw-justify-center tw-items-center">
                      <button
                        disabled={isConnectionButtonsLoading}
                        onClick={() => {
                          initiateConnectionProcess("remove");
                        }}
                        className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#a7a7a7] tw-text-white tw-rounded-[6px] tw-text-[12px]"
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
                          "Connected"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          navigateToConversation(
                            "single",
                            profileInfo.connection.connection_id,
                            profileInfo,
                          );
                        }}
                        className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-rounded-[6px] tw-text-[12px]"
                      >
                        Message
                      </button>
                    </div>
                  ) : profileInfo.connection.is_user_connection_initiator ? (
                    <div className="tw-flex tw-gap-[5px] tw-flex-wrap tw-justify-center tw-items-center">
                      <button
                        disabled={isConnectionButtonsLoading}
                        onClick={() => {
                          initiateConnectionProcess("accept");
                        }}
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
                            <AiOutlineLoading3Quarters
                              style={{ fontSize: "15px" }}
                            />
                          </motion.div>
                        ) : (
                          "Accept"
                        )}
                      </button>
                      <button
                        disabled={isConnectionButtonsLoading}
                        onClick={() => {
                          initiateConnectionProcess("decline");
                        }}
                        className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#666666] tw-text-white tw-rounded-[6px] tw-text-[12px]"
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
                          "Decline"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isConnectionButtonsLoading}
                      onClick={() => {
                        initiateConnectionProcess("cancel");
                      }}
                      className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-red-500 tw-text-white tw-rounded-[6px] tw-text-[12px]"
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
                        "Cancel Request"
                      )}
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
      <div className="tw-bg-transparent tw-max-w-[1200px] tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-center md:tw-items-start">
        <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
          <div className="tw-w-full tw-h-fit tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
            <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
              {profileInfo.gender && (
                <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                  {genderIcons[profileInfo.gender]}
                  <span className="tw-text-[14px] tw-font-semibold">
                    {profileInfo.gender}
                  </span>
                </div>
              )}
              <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                <IoTime style={{ fontSize: "20px", color: "#666666" }} />
                <span className="tw-text-[14px]">Joined </span>
                <span className="tw-text-[14px] tw-font-semibold tw-text-left">
                  {formattedDateToWords(profileInfo.dateCreated.date)}
                </span>
              </div>
              <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-mt-[2px]">
                <MdCake
                  style={{
                    fontSize: "20px",
                    color: "#666666",
                    marginTop: "-4px",
                  }}
                />
                <span className="tw-text-[14px]">Born in </span>
                <span className="tw-text-[14px] tw-font-semibold tw-text-left">
                  {profileInfo.birthdate
                    ? `${ordinal_suffix_of(
                        parseInt(profileInfo.birthdate.day),
                      )} of 
                    ${profileInfo.birthdate.month} ${
                      profileInfo.birthdate.year
                    }`
                    : "not provided"}
                </span>
              </div>
            </div>
          </div>
          <div className="tw-h-fit tw-w-full tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
            <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
              <div className="tw-w-full tw-flex">
                <div className="tw-flex tw-flex-row tw-flex-1 tw-gap-[5px] tw-items-center">
                  <FaBook style={{ fontSize: "17px", color: "#666666" }} />
                  <span className="tw-text-[14px] tw-font-semibold">Diary</span>
                </div>
                {params.userID === authentication.user.username && (
                  <Link
                    to={`/${params.userID}/diary`}
                    className="tw-text-[12px] tw-text-[#333333]"
                  >
                    View
                  </Link>
                )}
              </div>
              <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-mt-[2px]">
                <BiCalendarEdit
                  style={{
                    fontSize: "20px",
                    color: "#666666",
                    marginTop: "-4px",
                  }}
                />
                {diaryPreview.isLoaded ? (
                  diaryPreview.latest_entry ? (
                    <span className="tw-text-[14px]">
                      Latest entry on{" "}
                      <span className="tw-text-[14px] tw-font-semibold tw-text-left">
                        {formattedDateToWords(
                          diaryPreview.latest_entry,
                          "YYYY-MM-DD",
                        )}
                      </span>
                    </span>
                  ) : params.userID === authentication.user.username ? (
                    <span className="tw-text-[14px]">
                      Write your first entry
                    </span>
                  ) : (
                    <span className="tw-text-[14px]">
                      {profileInfo.fullname.firstName} has no entries
                    </span>
                  )
                ) : (
                  <Skeleton
                    className="tw-max-w-full tw-h-[18px]"
                    containerClassName="tw-w-[180px] -tw-mt-[5px]"
                    height="15px"
                    baseColor="rgb(210, 210, 210)"
                    count={1}
                  />
                )}
              </div>
              {params.userID === authentication.user.username && (
                <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                  <HiOutlinePencil
                    style={{ fontSize: "20px", color: "#666666" }}
                  />
                  {diaryPreview.isLoaded ? (
                    <span className="tw-text-[14px]">
                      {diaryPreview.total_entries}{" "}
                      {diaryPreview.total_entries > 1 ? "entries" : "entry"}{" "}
                      made{" "}
                    </span>
                  ) : (
                    <Skeleton
                      className="tw-max-w-full tw-h-[18px]"
                      containerClassName="tw-w-[200px] -tw-mt-[5px]"
                      height="15px"
                      baseColor="rgb(210, 210, 210)"
                      count={1}
                    />
                  )}
                </div>
              )}
              {diaryPreview.top_tags.length > 0 && (
                <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[10px]">
                  <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-mt-[2px]">
                    <TfiThought
                      style={{
                        fontSize: "20px",
                        color: "#666666",
                        marginTop: "-4px",
                      }}
                    />
                    {diaryPreview.isLoaded ? (
                      <span className="tw-text-[14px]">
                        {params.userID === authentication.user.username
                          ? "You've"
                          : `${profileInfo.fullname.firstName} has`}{" "}
                        been writing a lot about:
                      </span>
                    ) : (
                      <Skeleton
                        className="tw-max-w-full tw-h-[18px]"
                        containerClassName="tw-w-[220px] -tw-mt-[5px]"
                        height="15px"
                        baseColor="rgb(210, 210, 210)"
                        count={1}
                      />
                    )}
                  </div>
                  <motion.div
                    initial={{
                      paddingLeft: isMobileView ? "20px" : "20px",
                    }}
                    animate={{
                      paddingLeft: isMobileView ? "20px" : "20px",
                    }}
                    className="tw-flex tw-flex-wrap tw-gap-[6px]"
                  >
                    {diaryPreview.top_tags.map((mp) => {
                      return (
                        <div
                          key={mp.id}
                          className="tw-p-[6px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                        >
                          <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-white">
                            {mp.name}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-pb-[20px] tw-flex tw-flex-col tw-items-center">
          <div
            id="div_feed_header_post_input_profile"
            className="tw-border-[0px]"
          >
            {profileInfo.profile !== "none" ? (
              <div id="img_default_profile_container">
                <CachedImage
                  src={profileInfo.profile}
                  id="img_actual_profile"
                />
              </div>
            ) : (
              <div id="div_img_feed_header_container">
                <CachedImage src={DefaultProfile} id="img_feed_header" />
              </div>
            )}
            <div id="div_input_feed_flex">
              {toggleNewPostModal.toggle && (
                <NewPostModal
                  toShare={false}
                  sharePreviewData={null}
                  withImage={toggleNewPostModal.withImage}
                  profileInfo={profileInfo}
                  realmInfo={null}
                  setcreateposttext={setcreateposttext}
                  getpostprocess={GetPostProcess}
                  onclose={settoggleNewPostModal}
                />
              )}
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
          {paginatedPosts.count > 0 ? (
            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[10px]">
              {posts.map((mp: any, i: number) => {
                return <PostItem key={i} isSharePreview={false} mp={mp} />;
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
            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[10px]">
              {Array.from({ length: 8 }, (_, i: number) => {
                return <PostItemLoader key={i} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[100] tw-shadow-lg tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px" }} />
      </button>
      <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-gap-[15px] tw-items-center tw-justify-center">
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          id="div_loader_request"
        >
          <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;
