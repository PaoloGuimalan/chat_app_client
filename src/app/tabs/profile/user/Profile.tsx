/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  IDiaryPreview,
  ProfileUserInfoInterface,
} from "@/reusables/vars/interfaces";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { TfiThought } from "react-icons/tfi";
import { BsThreeDots } from "react-icons/bs";
import { MdBlock, MdReport } from "react-icons/md";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/app/reusables/Modal";
import {
  AcceptContactRequest,
  ContactRequest,
  DeclineContactRequest,
  GetDiaryTotalRequest,
  BlockUserRequest,
  ReportUserRequest,
} from "@/reusables/hooks/requests";
// import jwtDecode from "jwt-decode";
import { FaBook } from "react-icons/fa6";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaTransgender } from "react-icons/fa";
import { IoMale, IoFemale, IoTime } from "react-icons/io5";
import { MdCake } from "react-icons/md";
import { motion } from "framer-motion";
import {
  formattedDateToWords,
  ordinal_suffix_of,
} from "@/reusables/hooks/reusable";
import {
  SET_CONVERSATION_SETUP,
  SET_MINIMIZED_CONVERSATION,
  SET_TOGGLE_RIGHT_WIDGET,
} from "@/redux/types";
import { BiCalendarEdit } from "react-icons/bi";
import { HiOutlinePencil } from "react-icons/hi";
import ProfilePicContainer from "./ProfilePicContainer";
import ProfileCoverContainer from "./ProfileCoverContainer";
import Skeleton from "react-loading-skeleton";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import PostsContainer from "./PostsContainer";
import SavesContainer from "./SavesContainer";
import ArchivesContainer from "./ArchivesContainer";
import { Card } from "@/reusables/design";
import { PiShareFat } from "react-icons/pi";

function Profile({
  profileInfo,
  GetProfileInfoProcess,
  isSharePage = false,
}: {
  profileInfo: ProfileUserInfoInterface;
  GetProfileInfoProcess: () => void;
  isSharePage?: boolean;
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

  const [isConnectionButtonsLoading, setisConnectionButtonsLoading] =
    useState<boolean>(false);
  const [feedmode, setfeedmode] = useState<string>("posts");

  const [isBlockLoading, setisBlockLoading] = useState<boolean>(false);
  const [confirmBlock, setconfirmBlock] = useState<boolean>(false);
  const [isReportOpen, setisReportOpen] = useState<boolean>(false);
  const [reportReason, setreportReason] = useState<string>("spam");
  const [reportDescription, setreportDescription] = useState<string>("");
  const [isReportSubmitting, setisReportSubmitting] = useState<boolean>(false);
  const [isOptionsToggled, setisOptionsToggled] = useState<boolean>(false);
  const optionsWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsWrapperRef.current &&
        !optionsWrapperRef.current.contains(event.target as Node)
      ) {
        setisOptionsToggled(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const reportReasons: { value: string; label: string }[] = [
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harassment or bullying" },
    { value: "hate_speech", label: "Hate speech" },
    { value: "violence", label: "Violence or dangerous behavior" },
    { value: "nudity", label: "Nudity or sexual content" },
    { value: "csae", label: "Child sexual abuse or exploitation" },
    { value: "impersonation", label: "Impersonation" },
    { value: "misinformation", label: "Misinformation" },
    { value: "other", label: "Other" },
  ];

  const [diaryPreview, setDiaryPreview] = useState<IDiaryPreview>({
    isLoaded: false,
    latest_entry: null,
    top_tags: [],
    total_entries: 0,
  });

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
                // setpage((prev) => prev + 1);
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
    GetDiaryTotalProcess();
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

  const blockUserProcess = () => {
    if (!confirmBlock) {
      setconfirmBlock(true);
      return;
    }
    setisBlockLoading(true);
    BlockUserRequest(
      profileInfo.entityID,
      dispatch,
      alerts,
      setisBlockLoading,
    ).then((success) => {
      if (success) {
        navigate("/");
      } else {
        setconfirmBlock(false);
      }
    });
  };

  const submitReportProcess = () => {
    setisReportSubmitting(true);
    ReportUserRequest(
      {
        target_type: "user",
        target_id: profileInfo.entityID,
        reason: reportReason,
        description: reportDescription,
      },
      dispatch,
      alerts,
      setisReportSubmitting,
    ).then((success) => {
      if (success) {
        setisReportOpen(false);
        setreportDescription("");
        setreportReason("spam");
      }
    });
  };

  const genderIcons: any = {
    Male: <IoMale style={{ fontSize: "20px", color: "var(--text-2)" }} />,
    Female: <IoFemale style={{ fontSize: "17px", color: "var(--text-2)" }} />,
    Others: (
      <FaTransgender style={{ fontSize: "17px", color: "var(--text-2)" }} />
    ),
  };

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
                Shared profile
              </span>
              <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                View-only preview of this profile.
              </span>
            </div>
          </div>
        </Card>
      )}
      <div className="cl-profile-page__hero tw-mb-[6px] tw-w-full tw-h-auto tw-min-h-[auto] sm:tw-min-h-[500px] tw-flex tw-flex-col tw-justify-start sm:tw-justify-center tw-items-center tw-py-[0px] sm:tw-py-[0px]">
        <ProfileCoverContainer
          userID={profileInfo.id}
          realm_id={null}
          coverphoto={profileInfo.coverphoto}
          type="profile"
          isAllowed={true}
          getpostprocess={() => {}} // GetPostProcess
        />
        <div className="tw-w-[calc(100%-24px)] sm:tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1200px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[12px] tw-pr-[12px] sm:tw-pl-[40px] sm:tw-pr-[40px]">
          <ProfilePicContainer
            userID={profileInfo.id}
            realm_id={null}
            profile={profileInfo.profile}
            type="profile"
            isAllowed={true}
            getpostprocess={() => {}} // GetPostProcess
          />
          <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
            <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[16px] tw-sm:p-[0px]">
              <span className="tw-text-[25px] tw-font-bold tw-flex tw-items-center tw-gap-[5px]">
                <span>
                  {profileInfo.fullname.firstName}
                  {profileInfo.fullname.middleName == "N/A"
                    ? ""
                    : ` ${profileInfo.fullname.middleName}`}{" "}
                  {profileInfo.fullname.lastName}
                </span>
                {profileInfo.isBadged && (
                  <RiVerifiedBadgeFill size={18} color="var(--brand)" />
                )}
              </span>
              <span className="tw-text-[14px] tw-break-all tw-mb-[14px]">
                {profileInfo.email}
              </span>
              <span className="tw-text-[14px] tw-break-all">
                @{profileInfo.userID}
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
            {authentication.auth &&
              authentication.user.username !== params.userID &&
              profileInfo.connection.is_connection_present !== null && (
                <div className="tw-w-flex sm:tw-w-auto tw-w-full sm:tw-pb-[0px] tw-pb-[20px]">
                  {/* for add friend button */}
                  {!profileInfo.connection.is_connection_present ? (
                    <button
                      disabled={isConnectionButtonsLoading}
                      onClick={() => {
                        initiateConnectionProcess("add");
                      }}
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
                            { ...profileInfo, _id: profileInfo.id },
                          );
                        }}
                        className="cl-profile-action-button tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
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
                          "Accept"
                        )}
                      </button>
                      <button
                        disabled={isConnectionButtonsLoading}
                        onClick={() => {
                          initiateConnectionProcess("decline");
                        }}
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
                      className="cl-profile-action-button--danger tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
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
            {authentication.auth &&
              authentication.user.username !== params.userID && (
                <div
                  ref={optionsWrapperRef}
                  className="tw-relative tw-flex tw-items-center sm:tw-pb-[0px] tw-pb-[20px]"
                >
                  <button
                    onClick={() => {
                      setisOptionsToggled((prev) => !prev);
                    }}
                    className="tw-ml-[0px] sm:tw-ml-[10px] tw-w-[32px] tw-h-[32px] tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer"
                    aria-label="More options"
                  >
                    <BsThreeDots
                      style={{ fontSize: "17px", color: "var(--text)" }}
                    />
                  </button>
                  {isOptionsToggled && (
                    <div className="cl-post-options-menu tw-z-[2] tw-flex tw-flex-col tw-gap-[2px] tw-min-w-[160px] tw-absolute tw-right-[0px] tw-top-[36px] tw-p-[10px] tw-rounded-md tw-border-solid tw-border-[1px] tw-shadow-md">
                      <button
                        disabled={isBlockLoading}
                        onClick={() => {
                          blockUserProcess();
                        }}
                        className="cl-post-options-button cl-post-options-button--danger tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
                      >
                        <MdBlock
                          size={15}
                          style={{ marginLeft: "-1px", marginRight: "4px" }}
                        />
                        <span>
                          {isBlockLoading
                            ? "Blocking…"
                            : confirmBlock
                              ? "Confirm block"
                              : "Block"}
                        </span>
                      </button>
                      {confirmBlock && !isBlockLoading && (
                        <button
                          onClick={() => setconfirmBlock(false)}
                          className="cl-post-options-button tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
                        >
                          <IoClose
                            size={15}
                            style={{ marginLeft: "-1px", marginRight: "4px" }}
                          />
                          <span>Cancel block</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setisOptionsToggled(false);
                          setisReportOpen(true);
                        }}
                        className="cl-post-options-button tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
                      >
                        <MdReport
                          size={15}
                          style={{ marginLeft: "-1px", marginRight: "4px" }}
                        />
                        <span>Report</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
      {isReportOpen && (
        <Modal
          component={
            <div className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[460px] tw-p-[18px] tw-flex tw-flex-col tw-gap-[10px] tw-items-start tw-rounded-[12px]">
              <div className="tw-w-full tw-flex tw-items-center tw-gap-[8px]">
                <MdReport style={{ fontSize: "20px", color: "var(--text)" }} />
                <span className="tw-flex-1 tw-text-[14px] tw-font-semibold">
                  Report this account
                </span>
                <button
                  onClick={() => setisReportOpen(false)}
                  aria-label="Close"
                  className="tw-w-[28px] tw-h-[28px] tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer"
                >
                  <IoClose style={{ fontSize: "18px", color: "var(--text)" }} />
                </button>
              </div>
              <select
                value={reportReason}
                onChange={(e) => setreportReason(e.target.value)}
                className="tw-w-full tw-p-[8px] tw-rounded-[8px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] tw-text-[13px]"
              >
                {reportReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <textarea
                value={reportDescription}
                onChange={(e) => setreportDescription(e.target.value)}
                placeholder="Additional details (optional)"
                rows={4}
                className="tw-w-full tw-p-[8px] tw-rounded-[8px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] tw-text-[13px] tw-resize-none"
              />
              <div className="tw-w-full tw-flex tw-gap-[6px] tw-justify-end">
                <button
                  onClick={() => setisReportOpen(false)}
                  className="cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
                >
                  Cancel
                </button>
                <button
                  disabled={isReportSubmitting}
                  onClick={submitReportProcess}
                  className="cl-profile-action-button tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] tw-text-[12px]"
                >
                  {isReportSubmitting ? "Submitting…" : "Submit report"}
                </button>
              </div>
            </div>
          }
        />
      )}
      <div className="cl-profile-page__content tw-bg-transparent tw-max-w-[1200px] tw-w-[calc(100%-24px)] sm:tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-stretch md:tw-items-start">
        <div className="cl-profile-page__sidebar tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[8px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
          <div className="cl-profile-surface tw-w-full tw-h-fit tw-flex">
            <div className="tw-w-full tw-p-[18px] tw-flex tw-flex-col tw-items-start tw-gap-[12px]">
              {profileInfo.gender && (
                <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                  {genderIcons[profileInfo.gender]}
                  <span className="tw-text-[14px] tw-font-semibold">
                    {profileInfo.gender}
                  </span>
                </div>
              )}
              <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                <IoTime style={{ fontSize: "20px", color: "var(--text-2)" }} />
                <span className="tw-text-[14px]">Joined </span>
                <span className="tw-text-[14px] tw-font-semibold tw-text-left">
                  {formattedDateToWords(profileInfo.dateCreated.date)}
                </span>
              </div>
              <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-mt-[2px]">
                <MdCake
                  style={{
                    fontSize: "20px",
                    color: "var(--text-2)",
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
          <div className="cl-profile-surface tw-h-fit tw-w-full tw-flex">
            <div className="tw-w-full tw-p-[18px] tw-flex tw-flex-col tw-items-start tw-gap-[12px]">
              <div className="tw-w-full tw-flex">
                <div className="tw-flex tw-flex-row tw-flex-1 tw-gap-[5px] tw-items-center">
                  <FaBook
                    style={{ fontSize: "17px", color: "var(--text-2)" }}
                  />
                  <span className="tw-text-[14px] tw-font-semibold">Diary</span>
                </div>
                {params.userID === authentication.user.username && (
                  <Link
                    to={`/${params.userID}/diary`}
                    className="tw-text-[12px] tw-text-[var(--brand)]"
                  >
                    View
                  </Link>
                )}
              </div>
              <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-mt-[2px]">
                <BiCalendarEdit
                  style={{
                    fontSize: "20px",
                    color: "var(--text-2)",
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
                    baseColor="var(--surface-3)"
                    highlightColor="var(--surface-hover)"
                    count={1}
                  />
                )}
              </div>
              {params.userID === authentication.user.username && (
                <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                  <HiOutlinePencil
                    style={{ fontSize: "20px", color: "var(--text-2)" }}
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
                      baseColor="var(--surface-3)"
                      highlightColor="var(--surface-hover)"
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
                        color: "var(--text-2)",
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
                        baseColor="var(--surface-3)"
                        highlightColor="var(--surface-hover)"
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
                          className="tw-p-[6px] tw-pl-[10px] tw-pr-[10px] tw-bg-[var(--surface-2)] tw-rounded-[12px] tw-border tw-border-[var(--border)]"
                        >
                          <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-[var(--text)]">
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
        <div className="cl-profile-page__feed tw-w-full tw-pb-[12px] tw-flex tw-flex-col tw-items-center tw-gap-[4px]">
          {params.userID === authentication.user.username && (
            <div className="cl-profile-surface cl-profile-page__feed-nav tw-w-full tw-h-fit tw-flex tw-mb-[6px]">
              <motion.div
                initial={{
                  justifyContent: isMobileView ? "center" : "start",
                }}
                animate={{
                  justifyContent: isMobileView ? "center" : "start",
                }}
                className="tw-w-full tw-p-[10px] tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-gap-[4px]"
              >
                <motion.button
                  initial={{
                    backgroundColor:
                      feedmode === "posts"
                        ? "var(--brand-soft)"
                        : "transparent",
                    color:
                      feedmode === "posts" ? "var(--brand)" : "var(--text-2)",
                  }}
                  animate={{
                    backgroundColor:
                      feedmode === "posts"
                        ? "var(--brand-soft)"
                        : "transparent",
                    color:
                      feedmode === "posts" ? "var(--brand)" : "var(--text-2)",
                  }}
                  onClick={() => {
                    setfeedmode("posts");
                  }}
                  className="cl-profile-tab-button tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-font-Inter tw-p-[6px] tw-px-[10px] tw-cursor-pointer tw-rounded-md tw-border-none"
                >
                  <span className="tw-text-[12px] tw-font-semibold">Posts</span>
                </motion.button>
                <motion.button
                  initial={{
                    backgroundColor:
                      feedmode === "saves"
                        ? "var(--brand-soft)"
                        : "transparent",
                    color:
                      feedmode === "saves" ? "var(--brand)" : "var(--text-2)",
                  }}
                  animate={{
                    backgroundColor:
                      feedmode === "saves"
                        ? "var(--brand-soft)"
                        : "transparent",
                    color:
                      feedmode === "saves" ? "var(--brand)" : "var(--text-2)",
                  }}
                  onClick={() => {
                    setfeedmode("saves");
                  }}
                  className="cl-profile-tab-button tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-font-Inter tw-p-[6px] tw-px-[10px] tw-cursor-pointer tw-rounded-md tw-border-none"
                >
                  <span className="tw-text-[12px] tw-font-semibold">Saves</span>
                </motion.button>
                <motion.button
                  initial={{
                    backgroundColor:
                      feedmode === "archives"
                        ? "var(--brand-soft)"
                        : "transparent",
                    color:
                      feedmode === "archives"
                        ? "var(--brand)"
                        : "var(--text-2)",
                  }}
                  animate={{
                    backgroundColor:
                      feedmode === "archives"
                        ? "var(--brand-soft)"
                        : "transparent",
                    color:
                      feedmode === "archives"
                        ? "var(--brand)"
                        : "var(--text-2)",
                  }}
                  onClick={() => {
                    setfeedmode("archives");
                  }}
                  className="cl-profile-tab-button tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-font-Inter tw-p-[6px] tw-px-[10px] tw-cursor-pointer tw-rounded-md tw-border-none"
                >
                  <span className="tw-text-[12px] tw-font-semibold">
                    Archives
                  </span>
                </motion.button>
              </motion.div>
            </div>
          )}
          {feedmode === "posts" && (
            <PostsContainer
              profileInfo={profileInfo}
              hideComposer={isSharePage}
            />
          )}
          {feedmode === "saves" && <SavesContainer profileInfo={profileInfo} />}
          {feedmode === "archives" && (
            <ArchivesContainer profileInfo={profileInfo} />
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="cl-profile-page__shell tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[100] tw-shadow-lg tw-bg-[var(--surface)] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-full tw-border tw-border-[var(--border)] tw-flex tw-items-center tw-justify-center tw-text-[var(--text)] tw-cursor-pointer"
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
