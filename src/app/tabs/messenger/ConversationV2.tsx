/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../../styles/styles.css";
import { motion } from "framer-motion";
import { FcVideoCall, FcAddImage } from "react-icons/fc"; //FcInfo
import {
  BiSolidInfoCircle,
  BiSolidPhoneCall,
  BiWindows,
  BiLogOut,
} from "react-icons/bi";
import {
  RiAddCircleFill,
  RiInboxArchiveFill,
  RiInboxUnarchiveFill,
  RiVerifiedBadgeFill,
} from "react-icons/ri";
import { PiFlag } from "react-icons/pi";
import { IoArrowBack, IoDocumentOutline, IoSend } from "react-icons/io5";
import {
  MdAudiotrack,
  MdDelete,
  MdGraphicEq,
  MdMic,
  MdReport,
  MdStop,
} from "react-icons/md";
import ReportModal from "@/app/widgets/modals/ReportModal";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { leaveRealmPrompt } from "@/app/widgets/modals/confirmPrompts";
import { AiOutlineClose } from "react-icons/ai"; //AiFillInfoCircle
import { checkIfValid } from "../../../reusables/hooks/validatevariables";
import {
  CallRequest,
  ConversationInfoRequest,
  InitConversationInfoRequest,
  InitConversationListRequest,
  InitConversationRequest,
  IsTypingBroadcastRequest,
  RemoveRealmMemberRequest,
  ReplyAssistRequest,
  SeenMessageRequest,
  SendFilesRequest,
  SendMessageRequest,
  UpdateChatHistoryRequest,
} from "../../../reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  isUserOnline,
  makeid,
  sanitizeForStorage,
  timeSince,
} from "../../../reusables/hooks/reusable";
import { pickFiles } from "../../../reusables/hooks/pickFiles";
import { useDragAndDrop } from "../../../reusables/hooks/useDragAndDrop";
import { useLinkPreview } from "../../../reusables/hooks/useLinkPreview";
import LinkPreviewCard from "../../reusables/LinkPreviewCard";
import {
  CHECK_AND_ADD_NEW_CALL_LIST_WINDOW,
  CLOSE_MINIMIZED_CONVERSATION,
  REMOVE_CONVERSATION,
  // MEDIA_MY_VIDEO_HOLDER,
  // MEDIA_TRACK_HOLDER,
  // REMOVE_REJECTED_CALL_LIST,
  // SET_CALLS_LIST,
  SET_CONVERSATION_SETUP,
  SET_MESSAGES_LIST_OVERRIDE,
  SET_ALERTS,
  SET_MINIMIZED_CONVERSATION,
  SET_MUTATE_ALERTS,
  SET_PENDING_MESSAGES_LIST,
  SET_PREVIEW_PARTICIPANTS_BULK,
} from "../../../redux/types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ContentHandler from "./partials/ContentHandler";
import VoiceMessagePlayer from "./partials/VoiceMessagePlayer";
import TabAudioVisualizerCanvas from "./partials/TabAudioVisualizerCanvas";
import TabAudioVisualizerControl from "./partials/TabAudioVisualizerControl";
import {
  cycleVisualizerStyle,
  getVisualizerStyle,
  subscribeVisualizerStyle,
  VisualizerStyle,
} from "@/reusables/hooks/mediaVisualizerBus";
import ConversationInfoModal from "@/app/widgets/modals/Conversation/ConversationInfoModal";
import {
  AuthenticationInterface,
  ConversationInfoInterface,
  IConversationSetup,
  IPreviewParicipants,
} from "@/reusables/vars/interfaces";
import IsTypingLoader from "./partials/IsTypingLoader";
import { FaHashtag, FaLock } from "react-icons/fa6";
import { conversationsetupstate } from "@/redux/actions/states";
import { IoMdClose, IoMdSettings } from "react-icons/io";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { Avatar } from "@/reusables/design";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/reusables/vars/uploads";

// {
//     "conversationid": "26177616789363146166",
//     "userdetails": {
//         "userID": "",
//         "fullname": {
//             "firstName": "",
//             "middleName": "",
//             "lastName": ""
//         },
//         "profile": ""
//     },
//     "groupdetails": {
//         "_id": "26177616789363146166",
//         "serverID": null,
//         "groupID": "26177616789363146166",
//         "profile": "N/A",
//         "dateCreated": {
//             "date": "",
//             "time": ""
//         },
//         "createdBy": "paologuimalan",
//         "type": "group",
//         "privacy": true,
//         "groupName": "My Accounts",
//         "receivers": []
//     },
//     "type": "group"
// }

function ConversationV2({
  conversationID: conversationIDHolder,
  theme,
  isMinimized,
  setIsChatOpen,
}: any) {
  const { conversationID: conversationIDPath } = useParams();

  const conversationID = conversationIDHolder ?? conversationIDPath;

  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  // const mediatrackholder = useSelector((state: any) => state.mediatrackholder);
  const pendingcallalerts = useSelector(
    (state: any) => state.pendingcallalerts,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const callslist = useSelector((state: any) => state.callslist);
  const pendingmessageslist = useSelector(
    (state: any) => state.pendingmessageslist,
  );
  const messageslist = useSelector((state: any) => state.messageslist);
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  // const callslist = useSelector((state: any) => state.callslist);
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const istypinglist = useSelector((state: any) => state.istypinglist);
  const activeusersmapper = activeuserslist.map((mp: any) => mp._id);

  const previewparticipants: IPreviewParicipants[] = useSelector(
    (state: any) => state.previewparticipants,
  );

  const [conversationsetup, setconversationsetup] =
    useState<IConversationSetup | null>(null);
  const [switchingcontext, setswitchingcontext] = useState<boolean>(true);
  const [conversationLoadError, setconversationLoadError] = useState<
    string | null
  >(null);

  useEffect(() => {
    setconversationLoadError(null);
    InitConversationInfoRequest(conversationID)
      .then((response) => {
        setconversationsetup(response);
        setswitchingcontext(false);
      })
      .catch((err) => {
        console.log(err);
        // Without this, conversationsetup never gets populated, the
        // effect that fetches messages (gated on conversationsetup being
        // truthy) never runs, and isLoading - set true whenever
        // conversationIdentityKey changes - never gets flipped back off,
        // leaving the spinner spinning forever with no explanation.
        setconversationLoadError(
          err?.response?.data?.message ||
            "This conversation could not be loaded.",
        );
        setswitchingcontext(false);
      });
  }, [conversationID]);

  const getChannelPreviewParticipants = (channelID: string) => {
    return previewparticipants.filter(
      (flt: IPreviewParicipants) => flt.channelID === channelID,
    );
  };

  const activeuserSpecific =
    conversationsetup?.conversationType == "single" &&
    activeuserslist.filter(
      (flt: any) => flt._id == conversationsetup?.details?.entity_id,
    );
  const filteredistypinglist = useMemo(
    () =>
      istypinglist.filter((flt: any) => flt.conversationID === conversationID),
    [conversationsetup, istypinglist],
  );

  const conversationType = useMemo(
    () => conversationsetup?.conversationType,
    [conversationsetup],
  );
  const isServerConversation = conversationType === "channel";
  // A single conversation whose other participant is a realm-type entity
  // (e.g. a Page/business account) rather than a regular user or bot.
  const isRealmDM =
    conversationType === "single" &&
    conversationsetup?.details?.type === "realm";
  const canSendVoiceMessage =
    (conversationType === "single" || conversationType === "group") &&
    !isRealmDM &&
    !isMinimized;
  const [mentionState, setMentionState] = useState<{
    open: boolean;
    query: string;
    start: number;
  }>({
    open: false,
    query: "",
    start: -1,
  });
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const isCompactConversation = screensizelistener.W <= 799;
  const conversationHeaderIconSize = isCompactConversation ? "18px" : "20px";
  const conversationHeaderActionIconSize = isCompactConversation
    ? "17px"
    : "19px";
  const conversationHeaderPrimaryIconSize = isCompactConversation
    ? "21px"
    : "25px";
  const conversationMenuIconSize = isCompactConversation ? "18px" : "20px";
  const conversationFileIconSize = isCompactConversation ? "34px" : "40px";
  const conversationComposerIconSize = isCompactConversation ? "22px" : "25px";
  const conversationCloseIconSize = isCompactConversation ? "16px" : "18px";
  const conversationLoadingIconSize = isCompactConversation ? "20px" : "25px";

  const conversationIdentityKey = useMemo(() => {
    const userID = conversationsetup?.details?.id ?? "";
    const groupID = conversationsetup?.details?.id ?? "";
    return [
      conversationID ?? "",
      conversationsetup?.conversationType ?? "",
      userID,
      groupID,
    ].join("|");
  }, [
    conversationID,
    conversationsetup?.conversationType,
    conversationsetup?.details?.id,
  ]);

  const [messageValue, setmessageValue] = useState<string>("");
  const [conversationList, setconversationList] = useState<any[]>([]);
  const [totalMessages, settotalMessages] = useState<number>(0);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [autoScroll, setautoScroll] = useState<boolean>(true);
  const [isReplying, setisReplying] = useState<any>({
    isReply: false,
    replyingTo: "",
  });
  const [isalreadytyping, setisalreadytyping] = useState<boolean>(false);
  // base holds an object URL (from URL.createObjectURL(file)) for preview;
  // file is the real File sent to the server. Revoke base on removal/send.
  const [imgList, setimgList] = useState<any[]>([]);
  const [nonImgList, setnonImgList] = useState<any[]>([]);

  const [page, setpage] = useState<number>(1);
  const [range, setrange] = useState<number>(20);
  const [incrementer, setincrementer] = useState<number>(1);

  const [toggleConversationInfoModal, settoggleConversationInfoModal] =
    useState<boolean>(false);
  const [conversationinfo, setconversationinfo] =
    useState<ConversationInfoInterface | null>(null);
  const [toggleMenu, settoggleMenu] = useState<boolean>(false);
  const [isLeaveConfirmOpen, setisLeaveConfirmOpen] =
    useState<boolean>(false);
  const [isReportGroupOpen, setisReportGroupOpen] = useState<boolean>(false);
  const [visualizerStyle, setvisualizerStyle] =
    useState<VisualizerStyle>(getVisualizerStyle());
  useEffect(() => subscribeVisualizerStyle(setvisualizerStyle), []);
  const callRequestInFlightRef = useRef<Set<string>>(new Set());
  const normalizeNamePart = (value: any) => {
    if (!value || value === "N/A") {
      return "";
    }

    return String(value).trim();
  };
  const conversationMentionMembers = useMemo(() => {
    const currentUserID = authentication.user?.userID ?? "";
    const members = conversationinfo?.usersWithInfo ?? [];
    const mappedMembers = members
      .filter((member) => member._id !== currentUserID)
      .map((member) => {
        const fullName = [
          normalizeNamePart(member.fullname?.firstName),
          normalizeNamePart(member.fullname?.middleName),
          normalizeNamePart(member.fullname?.lastName),
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        return {
          ...member,
          mentionLabel:
            member.userID || member.fullname?.firstName || "someone",
          displayName: fullName || member.fullname?.firstName || "Someone",
        };
      })
      .filter(
        (member, index, self) =>
          self.findIndex((item) => item._id === member._id) === index,
      );

    return conversationType === "single"
      ? mappedMembers.slice(0, 1)
      : mappedMembers;
  }, [
    authentication.user?.userID,
    conversationType,
    conversationinfo?.usersWithInfo,
  ]);

  const getMemberInfo = (userID: string) => {
    if (!conversationinfo) {
      return "Someone";
    }

    const member = conversationinfo.usersWithInfo.filter(
      (flt) => flt._id === userID,
    );

    if (member.length > 0) {
      return member[0].fullname.firstName;
    }

    return "Someone";
  };

  const getMemberMentionLabel = (member: any) => {
    return member?.userID || member?.fullname?.firstName || "someone";
  };

  const getMemberFullName = (member: any) => {
    const fullName = [
      normalizeNamePart(member?.fullname?.firstName),
      normalizeNamePart(member?.fullname?.middleName),
      normalizeNamePart(member?.fullname?.lastName),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || member?.fullname?.firstName || "Someone";
  };

  const closeMentionSuggestions = () => {
    setMentionState({
      open: false,
      query: "",
      start: -1,
    });
    setMentionActiveIndex(0);
  };

  const updateMentionSuggestions = (
    value: string,
    cursorPosition: number = value.length,
  ) => {
    const beforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/(^|\s)@([^\s@]*)$/);

    if (!mentionMatch) {
      closeMentionSuggestions();
      return;
    }

    setMentionState({
      open: true,
      query: mentionMatch[2] ?? "",
      start: beforeCursor.lastIndexOf("@"),
    });
    setMentionActiveIndex(0);
  };

  const insertMentionAtCursor = (member: any) => {
    const textarea = inputMessageRef.current;
    if (!textarea || mentionState.start < 0) return;

    const selectionStart = textarea.selectionStart ?? messageValue.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const mentionText = `@${getMemberMentionLabel(member)} `;
    const before = messageValue.slice(0, mentionState.start);
    const after = messageValue.slice(selectionEnd);
    const nextValue = `${before}${mentionText}${after}`;

    setmessageValue(nextValue);
    closeMentionSuggestions();

    requestAnimationFrame(() => {
      textarea.focus();
      const nextCursor = (before + mentionText).length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const isConversationDisabled = useMemo(() => {
    if (conversationinfo?.users) {
      if (conversationinfo.users.length > 0) {
        return isLoading;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }, [conversationinfo, isLoading]);

  const mentionSuggestions = useMemo(() => {
    const normalizedQuery = mentionState.query.trim().toLowerCase();

    return conversationMentionMembers
      .filter((member) => {
        if (!normalizedQuery) return true;

        const mentionLabel = getMemberMentionLabel(member).toLowerCase();
        const displayName = getMemberFullName(member).toLowerCase();
        return (
          mentionLabel.includes(normalizedQuery) ||
          displayName.includes(normalizedQuery)
        );
      })
      .slice(0, 6);
  }, [conversationMentionMembers, mentionState.query]);

  const [fullImageScreen, setfullImageScreen] = useState<any>({
    preview: "",
    toggle: false,
  });

  const urllocation = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const divcontentRef = useRef<HTMLDivElement | null>(null);
  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  // const inputMessageRef = useRef<HTMLInputElement | null>(null);
  const inputMessageRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isalreadytyping) {
      setTimeout(() => {
        setisalreadytyping(false);
      }, 5000);
    }
  }, [isalreadytyping]);

  const ConversationInfoProcess = () => {
    if (!conversationsetup) return;

    if (conversationsetup.conversationID !== conversationID) return;

    if (switchingcontext) return;

    ConversationInfoRequest({
      conversationID: conversationID,
      type: conversationsetup.conversationType,
    })
      .then((response: any) => {
        if (response) {
          setconversationinfo(response.data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const InputFocusInit = () => {
    if (inputMessageRef) {
      if (inputMessageRef.current) {
        if (!isLoading) {
          inputMessageRef.current.focus();
        }
      }
    }
  };

  const setisReplyingTrigger = (data: any) => {
    setisReplying(data);
    InputFocusInit();
  };

  useEffect(() => {
    InputFocusInit();
  }, [conversationIdentityKey, inputMessageRef, isLoading]);

  useEffect(() => {
    ConversationInfoProcess();
  }, [conversationIdentityKey, switchingcontext, conversationsetup]);

  const scrollBottom = () => {
    const items = document.querySelectorAll(".div_messages_result");
    const last = items[0];

    if (!isLoading) {
      if (divcontentRef) {
        if (autoScroll) {
          if (last) {
            last.scrollIntoView({
              behavior: "instant",
              block: "end",
            });
          }
        }
      }
    }
  };

  useEffect(() => {
    let currentView = false;
    if (divcontentRef) {
      if (divcontentRef.current) {
        divcontentRef.current.onscroll = () => {
          if (divlazyloaderRef && divlazyloaderRef.current) {
            const top = divlazyloaderRef.current.getBoundingClientRect().top;
            const isVisible = top > 0 ? true : false;
            if (currentView != isVisible) {
              currentView = isVisible;
              if (currentView) {
                setrange(20);
                setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }

    scrollBottom();
  }, [
    autoScroll,
    conversationIdentityKey,
    messageslist,
    divcontentRef,
    divlazyloaderRef,
    isLoading,
    conversationList,
    pendingmessageslist,
  ]);

  const addPendingMessage = (pendingLoad: any) => {
    dispatch({
      type: SET_PENDING_MESSAGES_LIST,
      payload: {
        pendingmessageslist: [...pendingmessageslist, pendingLoad],
      },
    });
  };

  const addMultiplePendingMessage = (pendingArrayLoad: any) => {
    dispatch({
      type: SET_PENDING_MESSAGES_LIST,
      payload: {
        pendingmessageslist: [...pendingmessageslist, ...pendingArrayLoad],
      },
    });
  };

  const sendMessageProcess = () => {
    if (!conversationsetup) return;

    const pendingID = `${authentication.user.userID}_${
      conversationID
    }_${pendingmessageslist.length + 1}_${makeid(10)}`;
    if (checkIfValid([messageValue])) {
      if (conversationsetup.conversationType == "single") {
        addPendingMessage({
          conversationID: conversationID,
          pendingID: pendingID,
          content: messageValue,
          type: "text",
        });
        SendMessageRequest({
          conversationID: conversationID,
          pendingID: pendingID,
          receivers: conversationinfo?.users.map((mp: any) => mp._id),
          content: messageValue,
          isReply: isReplying.isReply,
          replyingTo: isReplying.replyingTo,
          messageType: "text",
          conversationType: conversationType,
        });
      } else {
        addPendingMessage({
          conversationID: conversationID,
          pendingID: pendingID,
          content: messageValue,
          type: "text",
        });
        SendMessageRequest({
          conversationID: conversationID,
          pendingID: pendingID,
          receivers: conversationinfo?.users.map((mp: any) => mp._id),
          content: messageValue,
          isReply: isReplying.isReply,
          replyingTo: isReplying.replyingTo,
          messageType: "text",
          conversationType: conversationType,
        });
      }
    }

    if (imgList.length > 0 || nonImgList.length > 0) {
      const combinedFiles = [...imgList, ...nonImgList];
      const pendingArrImages = combinedFiles.map((mp: any, i: number) => ({
        conversationID: conversationID,
        pendingID: `${pendingID}_${i}`,
        reference: mp.base,
        referenceMediaType: mp.type,
        type: mp.type,
        name: mp.name,
      }));

      addMultiplePendingMessage([
        ...pendingArrImages.map((mp) => ({
          ...mp,
          content: mp.reference,
          reference: null,
        })),
      ]);
      SendFilesRequest({
        conversationID: conversationID,
        isReply: isReplying.isReply,
        replyingTo: isReplying.replyingTo,
        conversationType: conversationType,
        files: combinedFiles.map((mp: any, i: number) => ({
          file: mp.file,
          pendingID: `${pendingID}_${i}`,
        })),
      });

      setimgList([]);
      setnonImgList([]);
    }

    setmessageValue("");
    linkPreview.dismiss();
    setisReplying({
      isReply: false,
      replyingTo: "",
    });
    closeMentionSuggestions();
  };

  useEffect(() => {
    setisLoading(true);
    setconversationList([]);
    setconversationinfo(null);
    setpage(1);
    dispatch({
      type: SET_PENDING_MESSAGES_LIST,
      payload: {
        pendingmessageslist: [],
      },
    });
  }, [conversationIdentityKey]);

  useEffect(() => {
    return () => {
      setisReplying({
        isReply: false,
        replyingTo: "",
      });
      setunreadmessages([]);
      setconversationsetup(null);
      setswitchingcontext(true);
    };
  }, [conversationID]);

  const [unreadmessages, setunreadmessages] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationinfo?.users?.length || unreadmessages.length === 0) {
      return;
    }

    const timerId = setTimeout(() => {
      SeenMessageRequest({
        conversationID: conversationID,
        range: range,
        receivers: conversationinfo?.users.map((mp) => mp._id),
        messageIDs: unreadmessages,
      })
        .then((response) => {
          setunreadmessages((prev) =>
            prev.filter((flt) => !response.seen.includes(flt)),
          );
        })
        .catch((err) => {
          console.log(err);
        });
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [
    range,
    conversationIdentityKey,
    conversationinfo,
    incrementer,
    unreadmessages,
  ]);

  useEffect(() => {
    if (!conversationsetup) return;

    InitConversationRequest(
      {
        conversationID: conversationID,
        range: range,
        page: page,
        receivers: conversationinfo?.users.map((mp: any) => mp._id),
      },
      setconversationList,
      settotalMessages,
      setisLoading,
      scrollBottom,
      () => {
        const isGroup = conversationsetup.conversationType === "group";
        const isChannel = isServerConversation
          ? conversationsetup.details?.id
            ? true
            : false
          : false;

        if (isGroup) {
          dispatch({
            type: SET_CONVERSATION_SETUP,
            payload: {
              conversationsetup: conversationsetupstate,
            },
          });

          return;
        }

        if (isChannel) {
          navigate(
            urllocation.pathname
              .split("/")
              .slice(0, urllocation.pathname.split("/").length - 1)
              .join("/"),
          );

          return;
        }
      },
    );
  }, [page, conversationIdentityKey, range, urllocation.pathname]);

  const GetConversation = useCallback(() => {
    if (!conversationsetup) return;

    setincrementer((prev) => prev + 1);
    // console.log("reload");
    InitConversationRequest(
      {
        conversationID: conversationID,
        range: range * page,
        page: 1,
        receivers: conversationinfo?.users.map((mp: any) => mp._id),
      },
      setconversationList,
      settotalMessages,
      setisLoading,
      scrollBottom,
      () => {
        const isGroup = conversationsetup.conversationType === "group";
        const isChannel = isServerConversation
          ? conversationsetup?.details.id
            ? true
            : false
          : false;
        if (isGroup) {
          dispatch({
            type: SET_CONVERSATION_SETUP,
            payload: {
              conversationsetup: conversationsetupstate,
            },
          });

          return;
        }

        if (isChannel) {
          navigate(
            urllocation.pathname
              .split("/")
              .slice(0, urllocation.pathname.split("/").length - 1)
              .join("/"),
          );

          return;
        }
      },
    );
  }, [
    conversationIdentityKey,
    conversationinfo,
    dispatch,
    navigate,
    page,
    range,
    urllocation.pathname,
  ]);

  useEffect(() => {
    if (!conversationID) return;

    const eventName = conversationID;
    const handler = (event: CustomEvent) => {
      const data = event.detail.data;
      switch (event.detail.event) {
        case "reload":
          GetConversation();
          break;
        case "reload_deleted_message":
          setconversationList((prev) => {
            const deletedMessage = prev.filter(
              (flt) => flt.messageID === data.message.deletedMessageID,
            );

            const messagesWithoutDeleted = prev.filter(
              (flt) => flt.messageID !== data.message.deletedMessageID,
            );

            if (deletedMessage.length > 0) {
              const newDeletedMessageVersion = {
                ...deletedMessage[0],
                isDeleted: true,
              };

              const combinedList = [
                ...messagesWithoutDeleted,
                newDeletedMessageVersion,
              ];
              const uniqueById = combinedList.filter(
                (obj, index, self) =>
                  index === self.findIndex((t) => t._id === obj._id),
              );
              const sortedPostsDesc = uniqueById.sort((a, b) =>
                b._id.localeCompare(a._id),
              );
              return sortedPostsDesc;
            }

            return prev;
          });
          break;
        case "removed_user_notif":
          if (data.result.type === "group") {
            // dispatch({
            //   type: SET_CONVERSATION_SETUP,
            //   payload: {
            //     conversationsetup: conversationsetupstate,
            //   },
            // });
            navigate("/messages");

            return;
          }

          if (data.result.type === "channel") {
            navigate(
              urllocation.pathname
                .split("/")
                .slice(0, urllocation.pathname.split("/").length - 1)
                .join("/"),
            );

            return;
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener(eventName, handler as EventListener);

    return () => {
      document.removeEventListener(eventName, handler as EventListener);
    };
  }, [
    conversationIdentityKey,
    urllocation.pathname,
    GetConversation,
    dispatch,
    navigate,
  ]);


  const addFilesToComposer = (files: File[]) => {
    const oversized = files.some((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: {
            type: "warning",
            content: `Cannot upload files greater than ${MAX_UPLOAD_LABEL}`,
          },
        },
      });
    }

    files
      .filter((file) => file.size <= MAX_UPLOAD_BYTES)
      .forEach((file) => {
        const entry = {
          id: `${Date.now()}_${makeid(6)}`,
          name: file.name,
          base: URL.createObjectURL(file),
          type: file.type.includes("image") ? "image" : file.type,
          file,
        };

        if (file.type.includes("image")) {
          setimgList((prev: any) => [...prev, entry]);
        } else {
          setnonImgList((prev: any) => [...prev, entry]);
        }
      });
  };

  const sendImageProcess = async () => {
    const files = await pickFiles({ accept: "image/*" });
    addFilesToComposer(files);
  };

  const sendNonImageFilesProcess = async () => {
    const files = await pickFiles({});
    addFilesToComposer(files);
  };

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceStreamRef = useRef<MediaStream | null>(null);

  const sendVoiceMessage = (blob: Blob) => {
    if (!conversationsetup || blob.size === 0) return;

    const pendingID = `${authentication.user.userID}_${conversationID}_${
      pendingmessageslist.length + 1
    }_${makeid(10)}`;
    const file = new File([blob], `voice_${Date.now()}.webm`, {
      type: "audio/webm",
    });

    addPendingMessage({
      conversationID: conversationID,
      pendingID: pendingID,
      content: URL.createObjectURL(blob),
      type: "audio/webm",
    });

    SendFilesRequest({
      conversationID: conversationID,
      isReply: isReplying.isReply,
      replyingTo: isReplying.replyingTo,
      conversationType: conversationType,
      files: [{ file, pendingID }],
    });
  };

  const startVoiceRecording = async () => {
    if (!canSendVoiceMessage || isConversationDisabled || isRecordingVoice) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
        voiceStreamRef.current = null;
        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        voiceChunksRef.current = [];
        sendVoiceMessage(blob);
      };

      voiceRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
    } catch (err) {
      console.log(err);
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: {
            type: "warning",
            content: "Microphone access is required to send a voice message",
          },
        },
      });
    }
  };

  const stopVoiceRecording = () => {
    voiceRecorderRef.current?.stop();
    voiceRecorderRef.current = null;
    setIsRecordingVoice(false);
  };

  const { isDragging: isDraggingFiles, dragHandlers: composerDragHandlers } =
    useDragAndDrop({
      onFiles: addFilesToComposer,
      disabled: isConversationDisabled,
    });

  const linkPreview = useLinkPreview({
    text: messageValue,
    enabled: !isConversationDisabled,
  });

  const removeSelectedPreview = (prevID: any) => {
    const removed = imgList.find((flt) => flt.id == prevID);
    if (removed?.base) URL.revokeObjectURL(removed.base);
    setimgList(imgList.filter((flt) => flt.id != prevID));
  };

  const removeSelectedPreviewNonImg = (prevID: any) => {
    const removed = nonImgList.find((flt) => flt.id == prevID);
    if (removed?.base) URL.revokeObjectURL(removed.base);
    setnonImgList(nonImgList.filter((flt) => flt.id != prevID));
  };

  const messageTypeChecker: any = {
    video: "a video",
    audio: "an audio",
    image: "a photo",
    any: "a file",
  };

  //   console.log(conversationsetup)

  const initializeCall = (type: string) => {
    if (!conversationsetup) return;
    if (isRealmDM) return;

    const callRecipients =
      conversationsetup.conversationType == "single"
        ? [conversationsetup?.details.entity_id]
        : conversationinfo?.users
            ?.map((mp: any) => mp._id)
            .filter((flt: any) => flt != authentication.user.entity_id) ||
          conversationsetup?.participant_ids.filter(
            (flt: any) => flt != authentication.user.entity_id,
          ) ||
          [];

    if (getChannelPreviewParticipants(conversationID).length > 0) {
      dispatch({
        type: CHECK_AND_ADD_NEW_CALL_LIST_WINDOW,
        payload: {
          callmetadata: {
            ...conversationsetup,
            conversationID,
            type,
            isGroup: conversationsetup.conversationType !== "single",
            conversationType: conversationsetup.conversationType,
            callType: type,
            caller: {
              name: getChannelPreviewParticipants(conversationID)[0].entityID,
              entityID:
                getChannelPreviewParticipants(conversationID)[0].entityID,
            },
            recepients: callRecipients,
            instance: getChannelPreviewParticipants(conversationID)[0].instance,
          },
        },
      });
      return;
    }

    const caller = {
      name: authentication.user.fullName.firstName,
      entityID: authentication.user.entity_id,
    };
    const callKey = `${conversationID}-${type}`;
    const hasPendingAlert =
      pendingcallalerts.filter(
        (fltcall: any) => fltcall.callID == conversationID,
      ).length > 0;
    const hasOpenCallWindow =
      callslist.filter((onc: any) => onc.conversationID == conversationID)
        .length > 0;

    if (
      !hasPendingAlert &&
      !hasOpenCallWindow &&
      !callRequestInFlightRef.current.has(callKey)
    ) {
      callRequestInFlightRef.current.add(callKey);
      CallRequest({
        callType: type,
        callDisplayName:
          conversationsetup.conversationType == "single"
            ? `${authentication.user.fullName.firstName}`
            : `${conversationsetup?.details.display_name} (Group)`,
        conversationType: conversationsetup.conversationType,
        conversationID,
        caller,
        recepients: callRecipients,
        // The CALLER's own picture, like the two fields above it.
        //
        // Everything in this payload describes whoever is being announced, and
        // for a 1:1 call that is us - callDisplayName and caller.entityID both
        // read off authentication.user for exactly that reason. This one read
        // conversationsetup.details.profile, which is the person we are
        // ringing, so their alert showed them their own face under our name.
        displayImage:
          conversationsetup.conversationType == "single"
            ? authentication.user.profile || "none"
            : "none",
      }).finally(() => {
        callRequestInFlightRef.current.delete(callKey);
      });
    }

    dispatch({
      type: CHECK_AND_ADD_NEW_CALL_LIST_WINDOW,
      payload: {
        callmetadata: {
          ...conversationsetup,
          conversationID,
          type,
          isGroup: conversationsetup.conversationType !== "single",
          conversationType: conversationsetup.conversationType,
          callType: type,
          caller,
          recepients: callRecipients,
          instance: null,
        },
      },
    });
  };

  const LeaveConversationProcess = () => {
    if (!conversationinfo) return;

    settoggleMenu(false);
    RemoveRealmMemberRequest(conversationinfo.contactID, [
      authentication.active_entity_context.id,
    ])
      .then((response) => {
        if (!response.status) {
          // Most often "Transfer ownership to another member before
          // leaving." - this surface has no my_role to check up front, so
          // the server's reason is what tells the user why nothing happened.
          dispatch({
            type: SET_ALERTS,
            payload: {
              alerts: {
                id: alerts.length,
                type: "warning",
                content: response?.message || "Could not leave. Try again.",
              },
            },
          });
          return;
        }
        if (response.status) {
          if (isMinimized) {
            dispatch({
              type: CLOSE_MINIMIZED_CONVERSATION,
              payload: {
                conversationID: conversationID,
              },
            });
          } else {
            // A channel lives inside a server, so /messages strands you in a
            // different tab entirely - go back to the server you were in.
            //
            // serverID rather than the conversation's own type: it is the
            // parent realm, null on a plain group (see the sample payload up
            // top) and set on anything inside a server. That covers the
            // type === "server" case this button also allows, which a
            // conversationType === "channel" check would miss.
            const serverID = conversationinfo?.conversationInfo?.serverID;
            navigate(serverID ? `/servers/${serverID}` : "/messages");
          }

          dispatch({
            type: REMOVE_CONVERSATION,
            payload: {
              conversationID: conversationID,
            },
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const UpdateChatHistoryProcess = (action: string) => {
    settoggleMenu(false);
    UpdateChatHistoryRequest({
      conversationID: conversationID,
      action,
    })
      .then(() => {
        if (isMinimized) {
          dispatch({
            type: CLOSE_MINIMIZED_CONVERSATION,
            payload: {
              conversationID: conversationID,
            },
          });
        } else {
          navigate("/messages");
        }

        if (action !== "unarchive") {
          dispatch({
            type: REMOVE_CONVERSATION,
            payload: {
              conversationID: conversationID,
            },
          });
        } else {
          InitConversationListRequest(1, 20).then((response) => {
            dispatch({
              type: SET_PREVIEW_PARTICIPANTS_BULK,
              payload: {
                participants: response.conversationslist
                  .map((mp: any) => mp.voice_participants)
                  .flat(),
              },
            });
            dispatch({
              type: SET_MESSAGES_LIST_OVERRIDE,
              payload: {
                messageslist: response.items,
              },
            });
            setisLoading(false);
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const goBackToConversationList = () => {
    if (isServerConversation && conversationinfo?.conversationInfo?.serverID) {
      navigate(`/servers/${conversationinfo?.conversationInfo?.serverID}`);

      return;
    }

    navigate("/messages");
  };

  const ReplyAssistProcess = () => {
    ReplyAssistRequest(conversationID, isReplying.replyingTo)
      .then((response) => {
        if (response.status) {
          setmessageValue(response.message);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if (!conversationsetup) {
    return (
      <div
        id="div_conversation"
        className={
          isMinimized
            ? "cl-conversation-window cl-conversation-window--minimized"
            : "cl-conversation-window"
        }
      >
        <div id="div_conversation_content_loader">
          {conversationLoadError ? (
            <>
              <BiSolidInfoCircle
                style={{ fontSize: "32px", color: "var(--text-2)" }}
              />
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-2)",
                  textAlign: "center",
                  maxWidth: 280,
                }}
              >
                {conversationLoadError}
              </span>
            </>
          ) : (
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
              <AiOutlineLoading3Quarters
                style={{ fontSize: conversationLoadingIconSize }}
              />
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Sibling of the shell rather than a child: the shell animates its own
        display to "none" on some breakpoints, and the report modal must not
        inherit that. */}
    {isLeaveConfirmOpen && (
      <ConfirmModal
        {...leaveRealmPrompt(
          // Same split the button's own label uses: a server/channel thread
          // is a channel, everything else here is a group.
          conversationinfo?.type === "server" ||
            conversationinfo?.type === "channel"
            ? "channel"
            : "group",
        )}
        onClose={() => setisLeaveConfirmOpen(false)}
        onConfirm={() => {
          setisLeaveConfirmOpen(false);
          LeaveConversationProcess();
        }}
      />
    )}
    {isReportGroupOpen && conversationinfo?.contactID && (
      <ReportModal
        targetType="realm"
        // A group's contactID is its realm id, which the reports endpoint
        // resolves a realm from just as it does an entity id.
        targetId={conversationinfo.contactID}
        title="Report this group"
        onClose={() => setisReportGroupOpen(false)}
      />
    )}
    <motion.div
      animate={{
        display:
          pathnamelistener.includes("messages") ||
          isServerConversation ||
          conversationType === "conference"
            ? "flex"
            : screensizelistener.W <= 900
              ? "none"
              : "flex",
        maxWidth: isMinimized
          ? "100%"
          : pathnamelistener.includes("messages") ||
              isServerConversation ||
              conversationType === "conference"
            ? "100%"
            : screensizelistener.W <= 900
              ? "350px"
              : "350px",
        paddingTop: isMinimized
          ? "0px"
          : pathnamelistener.includes("messages") ||
              isServerConversation ||
              conversationType === "conference"
            ? isServerConversation || conversationType === "conference"
              ? "0px"
              : "0px"
            : screensizelistener.W <= 900
              ? "20px"
              : "20px",
      }}
      id="div_conversation"
      className={
        isMinimized
          ? "cl-conversation-window cl-conversation-window--minimized"
          : "cl-conversation-window"
      }
    >
      <motion.div
        initial={{
          paddingRight: isMinimized
            ? "0px"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "0px"
              : screensizelistener.W <= 900
                ? "20px"
                : "20px",
          paddingBottom: isMinimized
            ? "0px"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          width: isMinimized
            ? "calc(100% - 0px)"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 20px)"
                : "calc(100% - 20px)",
          height: isMinimized
            ? "calc(100% - 0px)"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 10px)"
                : "calc(100% - 10px)",
        }}
        animate={{
          paddingRight: isMinimized
            ? "0px"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "0px"
              : screensizelistener.W <= 900
                ? "20px"
                : "20px",
          paddingBottom: isMinimized
            ? "0px"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "0px"
              : screensizelistener.W <= 900
                ? "10px"
                : "10px",
          width: isMinimized
            ? "calc(100% - 0px)"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 20px)"
                : "calc(100% - 20px)",
          height: isMinimized
            ? "calc(100% - 0px)"
            : pathnamelistener.includes("messages") ||
                isServerConversation ||
                conversationType === "conference"
              ? "calc(100% - 0px)"
              : screensizelistener.W <= 900
                ? "calc(100% - 10px)"
                : "calc(100% - 10px)",
        }}
        id="div_conversation_container"
      >
        <motion.div
          initial={{
            height: "0px",
            paddingBottom: "0px",
            paddingTop: "0px",
            borderRadius: isMinimized
              ? "18px"
              : pathnamelistener.includes("messages") ||
                  conversationType === "conference"
                ? "0px"
                : screensizelistener.W <= 900
                  ? "10px"
                  : "10px",
            border:
              isServerConversation || conversationType === "conference"
                ? "none"
                : "solid 1px rgb(210, 210, 210)",
          }}
          animate={{
            height: "calc(100% - 0px)",
            paddingBottom: "0px",
            paddingTop: "5px",
            borderRadius: isMinimized
              ? "18px"
              : pathnamelistener.includes("messages") ||
                  conversationType === "conference"
                ? "0px"
                : screensizelistener.W <= 900
                  ? "10px"
                  : "10px",
          }}
          id="div_conversation_content_handler"
          className={`tw-border-[0px] tw-relative ${
            isMinimized &&
            "cl-conversation-window-shell tw-shadow-md tw-border-[1px] tw-border-[#dedede]"
          }`}
          {...composerDragHandlers}
        >
          {isDraggingFiles && (
            <div
              className="tw-absolute tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-pointer-events-none"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "2px dashed var(--text-2, #fff)",
                borderRadius: "inherit",
              }}
            >
              <span className="tw-text-white cl-text-body tw-font-medium">
                Drop files to attach
              </span>
            </div>
          )}
          <motion.div
            initial={{
              paddingLeft:
                isServerConversation || conversationType === "conference"
                  ? screensizelistener.W <= 900
                    ? "0px"
                    : "10px"
                  : "10px",
            }}
            animate={{
              paddingLeft:
                isServerConversation || conversationType === "conference"
                  ? screensizelistener.W <= 900
                    ? "0px"
                    : "10px"
                  : "10px",
            }}
            id="div_conversation_header"
            className="cl-conversation-header-shell"
          >
            <div id="div_conversation_user">
              {screensizelistener.W <= 900 && (
                <button
                  type="button"
                  aria-label="Back to messages list"
                  onClick={() => {
                    if (typeof setIsChatOpen === "function") {
                      setIsChatOpen(false);
                      return;
                    }
                    goBackToConversationList();
                  }}
                  id="div_img_cncts_container"
                  className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-p-0"
                >
                  <div id="div_img_server_back_container_cncts">
                    <IoArrowBack
                      style={{ fontSize: conversationHeaderIconSize }}
                    />
                  </div>
                </button>
              )}
              {!isServerConversation && conversationType !== "conference" && (
                <div id="div_img_cncts_container">
                  <Avatar
                    id={conversationsetup.details.id}
                    name={`${conversationsetup.details.display_name}`}
                    src={
                      conversationsetup.details.profile == "none"
                        ? undefined
                        : conversationsetup.details.profile
                    }
                    size={screensizelistener.W <= 799 ? 42 : 48}
                    // ring="unviewed"
                  />
                  {isUserOnline(
                    activeuserslist,
                    conversationsetup.details.id,
                  ) && <div className="div_online_indicator" />}
                </div>
              )}
              <div id="div_conversation_user_name">
                {conversationsetup.conversationType == "single" ? (
                  // The badge/flag live INSIDE .span_userdetails_name, not in a
                  // wrapper around it. That class is sized by
                  // `:first-of-type` (16px/750) vs `:last-of-type` (12px), which
                  // are scoped per parent - wrapping it made the name the only
                  // span of its type in that wrapper, so it matched BOTH and the
                  // later `:last-of-type` rule shrank it to the subtitle size.
                  // Same shape the group branch below already uses.
                  <span className="span_userdetails_name tw-flex tw-items-center tw-gap-[3px]">
                    <span
                      className="tw-truncate tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                      onClick={() => {
                        navigate(`/${conversationsetup.details.username}`);
                      }}
                    >
                      {conversationsetup.details.display_name}
                    </span>
                    {conversationsetup.details.is_verified && (
                      <RiVerifiedBadgeFill
                        size={14}
                        color="var(--brand)"
                        style={{ flex: "none" }}
                      />
                    )}
                    {/* Only a PAGE. Groups/channels are realms too, but the
                        lock/hash glyph beside them already says what they
                        are. Matches the Network row's page flag. */}
                    {conversationsetup.details.realm_type === "page" && (
                      <span
                        title="Page"
                        style={{ display: "inline-flex", flex: "none" }}
                      >
                        <PiFlag size={13} color="var(--text-3)" />
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="span_userdetails_name tw-flex tw-items-center tw-gap-[3px]">
                    {isServerConversation &&
                      (conversationsetup.details.privacy ? (
                        <FaLock style={{ fontSize: "12px" }} />
                      ) : (
                        <FaHashtag />
                      ))}{" "}
                    {conversationsetup.details.display_name}
                    {conversationsetup.details.is_verified && (
                      <RiVerifiedBadgeFill
                        size={14}
                        color="var(--brand)"
                        style={{ flex: "none" }}
                      />
                    )}
                  </span>
                )}
                {conversationType !== "conference" &&
                  (conversationsetup.conversationType == "single" ? (
                    activeusersmapper.includes(
                      conversationsetup?.details.entity_id,
                    ) ? (
                      activeuserSpecific[0].sessiondate ? (
                        activeuserSpecific[0].sessionStatus ? (
                          <span className="span_userdetails_name">
                            Active Now
                          </span>
                        ) : activeuserSpecific[0].sessiondate.time ? (
                          <span className="span_userdetails_name">
                            {activeuserSpecific[0].sessiondate.time}{" "}
                            {activeuserSpecific[0].sessiondate.date}
                          </span>
                        ) : (
                          <span className="span_userdetails_name">
                            {timeSince(activeuserSpecific[0].sessiondate.date)}
                          </span>
                        )
                      ) : (
                        <span className="span_userdetails_name">
                          Recently Active
                        </span>
                      )
                    ) : (
                      <span className="span_userdetails_name">
                        Recently Active
                      </span>
                    )
                  ) : (
                    <span className="span_userdetails_name">
                      Members are active
                    </span>
                  ))}
              </div>
            </div>
            <div id="div_conversation_header_navigations">
              {toggleConversationInfoModal && conversationinfo && (
                <ConversationInfoModal
                  conversationinfo={conversationinfo}
                  onclose={settoggleConversationInfoModal}
                />
              )}
              {isMinimized && (
                <>
                  <motion.button
                    whileHover={{
                      backgroundColor: "var(--surface-hover)",
                    }}
                    className="btn_conversation_header_navigation cl-conversation-window-action cl-conversation-window-action--info"
                    disabled={conversationinfo ? false : true}
                    onClick={() => {
                      settoggleConversationInfoModal(
                        !toggleConversationInfoModal,
                      );
                    }}
                  >
                    <BiSolidInfoCircle
                      style={{ fontSize: conversationHeaderActionIconSize }}
                    />
                  </motion.button>
                  <motion.button
                    whileHover={{
                      backgroundColor: "var(--surface-hover)",
                    }}
                    className="btn_conversation_header_navigation cl-conversation-window-action cl-conversation-window-action--close"
                    disabled={conversationinfo ? false : true}
                    onClick={() => {
                      dispatch({
                        type: CLOSE_MINIMIZED_CONVERSATION,
                        payload: {
                          conversationID: conversationID,
                        },
                      });
                    }}
                  >
                    <IoMdClose
                      style={{ fontSize: conversationCloseIconSize }}
                    />
                  </motion.button>
                </>
              )}
              {!isMinimized && (
                <>
                  {!isServerConversation &&
                    conversationType !== "conference" &&
                    !isRealmDM && (
                      <motion.button
                        // disabled={true}
                        disabled={
                          pendingcallalerts.filter(
                            (fltcall: any) => fltcall.callID == conversationID,
                          ).length > 0
                            ? true
                            : false
                        }
                        onClick={() => {
                          // initMediaDevices("audio");
                          initializeCall("audio");
                        }}
                        className="btn_conversation_header_navigation"
                      >
                        <BiSolidPhoneCall
                          style={{
                            fontSize: conversationHeaderPrimaryIconSize,
                            color: "#4994ec",
                          }}
                        />
                      </motion.button>
                    )}
                  {!isServerConversation &&
                    conversationType !== "conference" &&
                    !isRealmDM && (
                      <motion.button
                        // disabled={true}
                        disabled={
                          pendingcallalerts.filter(
                            (fltcall: any) => fltcall.callID == conversationID,
                          ).length > 0
                            ? true
                            : false
                        }
                        onClick={() => {
                          // initMediaDevices("video");
                          initializeCall("video");
                        }}
                        className="btn_conversation_header_navigation"
                      >
                        <FcVideoCall
                          style={{
                            fontSize: conversationHeaderPrimaryIconSize,
                          }}
                        />
                      </motion.button>
                    )}
                  <div className="tw-relative">
                    {conversationType !== "conference" ? (
                      <motion.button
                        className={`btn_conversation_header_navigation ${
                          isServerConversation
                            ? "cl-conversation-header-action--server"
                            : ""
                        }`}
                        disabled={conversationinfo ? false : true}
                        onClick={() => {
                          settoggleMenu(!toggleMenu);
                        }}
                        // onBlur={() => {
                        //   settoggleMenu(false);
                        // }}
                      >
                        <BiSolidInfoCircle
                          style={{
                            fontSize: conversationMenuIconSize,
                            color: isServerConversation
                              ? "var(--gold)"
                              : theme.primary,
                          }}
                        />
                      </motion.button>
                    ) : (
                      <motion.button
                        className={`btn_conversation_header_navigation ${
                          isServerConversation
                            ? "cl-conversation-header-action--server"
                            : ""
                        }`}
                        disabled={conversationinfo ? false : true}
                        onClick={() => {
                          if (setIsChatOpen) {
                            setIsChatOpen(false);
                          }
                        }}
                        // onBlur={() => {
                        //   settoggleMenu(false);
                        // }}
                      >
                        <IoMdClose
                          style={{
                            fontSize: conversationMenuIconSize,
                            color: isServerConversation
                              ? "var(--gold)"
                              : theme.primary,
                          }}
                        />
                      </motion.button>
                    )}
                    <motion.div
                      initial={{
                        scale: 0,
                      }}
                      animate={{
                        scale: toggleMenu ? 1 : 0,
                      }}
                      className={`cl-conversation-menu tw-flex-col tw-absolute tw-top-[30px] tw-min-w-[80px] tw-right-0 tw-rounded-md tw-p-[5px] tw-shadow-md tw-z-50 ${
                        isServerConversation
                          ? "cl-conversation-menu--server"
                          : ""
                      }`}
                    >
                      <motion.button
                        className={`cl-conversation-menu-action cl-conversation-menu-action--accent tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer ${
                          isServerConversation
                            ? "cl-conversation-menu-action--server"
                            : ""
                        }`}
                        disabled={conversationinfo ? false : true}
                        onClick={() => {
                          settoggleConversationInfoModal(
                            !toggleConversationInfoModal,
                          );
                          settoggleMenu(false);
                        }}
                      >
                        <BiSolidInfoCircle
                          style={{ fontSize: conversationMenuIconSize }}
                        />
                        <span className="cl-text-meta tw-font-Inter">
                          Info
                        </span>
                      </motion.button>
                      {conversationinfo?.type !== "single" &&
                        conversationinfo?.is_admin && (
                          <motion.button
                            className={`cl-conversation-menu-action cl-conversation-menu-action--accent tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer ${
                              isServerConversation
                                ? "cl-conversation-menu-action--server"
                                : ""
                            }`}
                            disabled={conversationinfo ? false : true}
                            onClick={() => {
                              navigate(
                                `/realms/${conversationinfo?.contactID}`,
                              );
                            }}
                          >
                            <IoMdSettings
                              style={{ fontSize: conversationMenuIconSize }}
                            />
                            <span className="cl-text-meta tw-font-Inter">
                              Manage
                            </span>
                          </motion.button>
                        )}
                      {!isMinimized &&
                        !(screensizelistener.W <= 900) &&
                        !isServerConversation &&
                        conversationType !== "conference" && (
                          <motion.button
                            className="cl-conversation-menu-action cl-conversation-menu-action--accent tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                            disabled={conversationinfo ? false : true}
                            onClick={() => {
                              dispatch({
                                type: SET_MINIMIZED_CONVERSATION,
                                payload: {
                                  conversation: {
                                    conversationID,
                                  },
                                },
                              });
                              navigate("/messages");
                              settoggleMenu(false);
                            }}
                          >
                            <BiWindows
                              style={{ fontSize: conversationMenuIconSize }}
                            />
                            <span className="cl-text-meta tw-font-Inter">
                              Minimize
                            </span>
                          </motion.button>
                        )}
                      {conversationinfo &&
                      conversationinfo.chatHistory &&
                      conversationinfo.chatHistory.isArchived
                        ? !isServerConversation &&
                          conversationType !== "conference" && (
                            <motion.button
                              className="cl-conversation-menu-action cl-conversation-menu-action--accent tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                              disabled={conversationinfo ? false : true}
                              onClick={() => {
                                UpdateChatHistoryProcess("unarchive");
                              }}
                            >
                              <RiInboxUnarchiveFill
                                style={{ fontSize: conversationMenuIconSize }}
                              />
                              <span className="cl-text-meta tw-font-Inter">
                                Unarchive
                              </span>
                            </motion.button>
                          )
                        : !isServerConversation &&
                          conversationType !== "conference" && (
                            <motion.button
                              className="cl-conversation-menu-action cl-conversation-menu-action--accent tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                              disabled={conversationinfo ? false : true}
                              onClick={() => {
                                UpdateChatHistoryProcess("archive");
                              }}
                            >
                              <RiInboxArchiveFill
                                style={{ fontSize: conversationMenuIconSize }}
                              />
                              <span className="cl-text-meta tw-font-Inter">
                                Archive
                              </span>
                            </motion.button>
                          )}
                      {isServerConversation && (
                        <TabAudioVisualizerControl
                          iconSize={conversationMenuIconSize}
                        />
                      )}
                      {isServerConversation && (
                        <motion.button
                          className="cl-conversation-menu-action cl-conversation-menu-action--accent cl-conversation-menu-action--server tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                          disabled={conversationinfo ? false : true}
                          onClick={() => {
                            cycleVisualizerStyle();
                          }}
                        >
                          <MdGraphicEq
                            style={{ fontSize: conversationMenuIconSize }}
                          />
                          <span className="cl-text-meta tw-font-Inter tw-capitalize">
                            Visualizer: {visualizerStyle}
                          </span>
                        </motion.button>
                      )}
                      {!isServerConversation &&
                        conversationType !== "conference" && (
                          <motion.button
                            className="cl-conversation-menu-action cl-conversation-menu-action--danger tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                            disabled={conversationinfo ? false : true}
                            onClick={() => {
                              UpdateChatHistoryProcess("clear");
                            }}
                          >
                            <MdDelete
                              style={{ fontSize: conversationMenuIconSize }}
                            />
                            <span className="cl-text-meta tw-font-Inter">
                              Delete
                            </span>
                          </motion.button>
                        )}
                      {isMinimized && (
                        <motion.button
                          className="cl-conversation-menu-action cl-conversation-menu-action--danger tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                          disabled={conversationinfo ? false : true}
                          onClick={() => {
                            dispatch({
                              type: CLOSE_MINIMIZED_CONVERSATION,
                              payload: {
                                conversationID: conversationID,
                              },
                            });
                            settoggleMenu(false);
                          }}
                        >
                          <IoMdClose
                            style={{ fontSize: conversationMenuIconSize }}
                          />
                          <span className="cl-text-meta tw-font-Inter">
                            Close
                          </span>
                        </motion.button>
                      )}
                      {/* GROUPS only, and above Leave so the destructive
                          entries stay last. Not single (not a realm - report
                          the person from their profile, or one message from
                          its own options) and not channel/server, where the
                          SERVER is what moderation acts on and is reportable
                          from its own info modal. */}
                      {conversationinfo?.type === "group" && (
                        <motion.button
                          className="cl-conversation-menu-action cl-conversation-menu-action--danger tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                          disabled={conversationinfo ? false : true}
                          onClick={() => {
                            settoggleMenu(false);
                            setisReportGroupOpen(true);
                          }}
                        >
                          <MdReport
                            style={{ fontSize: conversationMenuIconSize }}
                          />
                          <span className="cl-text-meta tw-font-Inter">
                            Report
                          </span>
                        </motion.button>
                      )}
                      {conversationinfo?.type !== "single" &&
                        conversationinfo?.type !== "conference" &&
                        // Public server/channel membership is just a
                        // side-effect of server membership (joining a server
                        // auto-adds you to all its channels) - not an
                        // independently leavable relationship. Only a
                        // privately-joined channel, or a group, is.
                        (conversationinfo?.type === "server" ||
                        conversationinfo?.type === "channel"
                          ? conversationinfo?.conversationInfo?.privacy === true
                          : true) && (
                          <motion.button
                            className="cl-conversation-menu-action cl-conversation-menu-action--danger tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer"
                            disabled={conversationinfo ? false : true}
                            onClick={() => {
                              settoggleMenu(false);
                              setisLeaveConfirmOpen(true);
                            }}
                          >
                            <BiLogOut
                              style={{ fontSize: conversationMenuIconSize }}
                            />
                            <span className="cl-text-meta tw-font-Inter">
                              Leave{" "}
                              {conversationinfo?.type === "server" ||
                              conversationinfo?.type === "channel"
                                ? "Channel"
                                : "Group"}
                            </span>
                          </motion.button>
                        )}
                    </motion.div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
          <div
            id="div_conversation_body"
            style={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              display: "flex",
              width: "100%",
              zIndex: 0,
            }}
          >
            {isLoading ? (
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
                  <AiOutlineLoading3Quarters
                    style={{ fontSize: conversationLoadingIconSize }}
                  />
                </motion.div>
              </div>
            ) : (
              <div
                id="div_conversation_content"
                ref={divcontentRef}
                onScroll={(e) => {
                  // console.log((e.currentTarget.scrollHeight - e.currentTarget.offsetHeight) - 100, e.currentTarget.scrollTop) OLD
                  // console.log(0 - 100, e.currentTarget.scrollTop) NEW
                  if (0 - 100 > e.currentTarget.scrollTop) {
                    setautoScroll(false);
                  } else {
                    setautoScroll(true);
                  }
                }}
              >
                {isServerConversation && <TabAudioVisualizerCanvas />}
                {filteredistypinglist.length > 0 && <IsTypingLoader />}
                {pendingmessageslist
                  .filter(
                    (flt: any) =>
                      flt.conversationID == conversationID &&
                      !flt.status &&
                      !conversationList
                        .map((mp) => mp.pendingID)
                        .includes(flt.pendingID),
                  )
                  .map((cnvs: any, i: number) => {
                    if (cnvs.type == "text") {
                      return (
                        <motion.div
                          key={i}
                          className="div_messages_result tw-items-center"
                        >
                          <motion.div
                            initial={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            animate={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
                          >
                            <motion.span
                              initial={{
                                backgroundColor: theme.lighten,
                                border: `solid 1px ${theme.lighten}`,
                                color: "white",
                                // marginLeft: "auto" : "0px"
                              }}
                              animate={{
                                backgroundColor: theme.lighten,
                                border: `solid 1px ${theme.lighten}`,
                                color: "white",
                                // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                              }}
                              className="span_messages_result c1"
                            >
                              <span
                                className="tw-whitespace-pre-line"
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeForStorage(cnvs.content),
                                }}
                              />
                            </motion.span>
                            <span className="span_sending_label">
                              Sending...
                            </span>
                          </motion.div>
                        </motion.div>
                      );
                    } else if (cnvs.type == "image") {
                      return (
                        <motion.div
                          key={i}
                          className="div_messages_result tw-items-center"
                        >
                          <motion.div
                            initial={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            animate={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
                          >
                            <div className="div_pending_content_container_sending">
                              <CachedImage
                                src={cnvs.content}
                                className="img_pending_images"
                                onLoad={() => {
                                  scrollBottom();
                                }}
                              />
                            </div>
                            <span className="span_sending_label">
                              ...Sending
                            </span>
                          </motion.div>
                        </motion.div>
                      );
                    } else if (cnvs.type.includes("video")) {
                      return (
                        <motion.div
                          key={i}
                          className="div_messages_result tw-items-center"
                        >
                          <motion.div
                            initial={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            animate={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
                          >
                            <div className="div_pending_content_container_sending">
                              <video
                                src={cnvs.content}
                                controls
                                className="tw-w-full tw-h-[300px] tw-border-[7px]"
                                onLoad={() => {
                                  scrollBottom();
                                }}
                              />
                            </div>
                            <span className="span_sending_label">
                              ...Sending
                            </span>
                          </motion.div>
                        </motion.div>
                      );
                    } else if (cnvs.type.includes("audio")) {
                      return (
                        <motion.div
                          key={i}
                          className="div_messages_result tw-items-center"
                        >
                          <motion.div
                            initial={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            animate={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
                          >
                            <VoiceMessagePlayer
                              src={cnvs.content}
                              isSender={true}
                              accentColor={theme.primary}
                              onReady={scrollBottom}
                            />
                            <span className="span_sending_label">
                              ...Sending
                            </span>
                          </motion.div>
                        </motion.div>
                      );
                    } else {
                      return (
                        <motion.div
                          key={i}
                          className="div_messages_result tw-items-center"
                        >
                          <motion.div
                            initial={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            animate={{
                              marginLeft: "auto",
                              alignItems: "flex-end",
                            }}
                            className="tw-flex tw-flex-col tw-w-full tw-max-w-[70%]"
                          >
                            <div className="tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]">
                              <div className="tw-w-full tw-max-w-[40px]">
                                <IoDocumentOutline
                                  style={{ fontSize: conversationFileIconSize }}
                                />
                              </div>
                              <span className="cl-text-caption tw-break-all ellipsis-3-lines tw-font-semibold">
                                {cnvs.name}
                              </span>
                            </div>
                            <span className="span_sending_label">
                              ...Sending
                            </span>
                          </motion.div>
                        </motion.div>
                      );
                    }
                  })}
                {getChannelPreviewParticipants(conversationID).length > 0 &&
                  conversationType !== "conference" &&
                  !isRealmDM && (
                    <div className="div_messages_result tw-w-[calc(100%-20px)] tw-flex tw-justify-center tw-p-[10px]">
                      <div className="tw-bg-[var(--surface)] tw-w-[calc(100%-20px)] tw-max-w-[calc(400px-20px)] tw-p-[10px] tw-rounded-xl tw-shadow-lg">
                        <div className="tw-w-full tw-flex tw-flex-col">
                          <span className="cl-text-body tw-font-semibold tw-font-Inter">
                            Ongoing Call
                          </span>
                        </div>
                        <div className="tw-w-full tw-flex tw-flex-col tw-h-[40px] tw-justify-center">
                          <span className="cl-text-caption tw-font-Inter">
                            {getChannelPreviewParticipants(conversationID)
                              .length === 1
                              ? `@${
                                  getChannelPreviewParticipants(
                                    conversationID,
                                  )[0].username
                                }`
                              : `${
                                  getChannelPreviewParticipants(conversationID)
                                    .length
                                } participants`}{" "}
                            joined the call
                          </span>
                        </div>
                        <div className="tw-w-full tw-flex tw-flex-col">
                          <button
                            onClick={() => {
                              initializeCall("audio");
                            }}
                            style={{
                              border: "1px solid var(--border-2)",
                            }}
                            className="tw-bg-[var(--surface-2)] tw-p-[6px] tw-w-full tw-rounded-md cl-text-body tw-text-[var(--text)] tw-font-semibold tw-cursor-pointer"
                          >
                            Join Call
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                {conversationList.map((cnvs, i) => {
                  return (
                    <ContentHandler
                      key={cnvs.messageID}
                      i={i}
                      cnvs={cnvs}
                      conversationsetup={conversationsetup}
                      members={conversationinfo?.usersWithInfo ?? []}
                      setisReplying={setisReplyingTrigger}
                      setfullImageScreen={setfullImageScreen}
                      scrollBottom={scrollBottom}
                      setunreadmessages={setunreadmessages}
                      theme={theme}
                    />
                  );
                })}
                {conversationList.length > 0 &&
                  totalMessages > page * range && (
                    <div
                      ref={divlazyloaderRef}
                      id="divlazyloader"
                      className="tw-flex tw-items-center tw-justify-center tw--mt-[15px] tw-mb-[5px]"
                    >
                      <div className="tw-h-[50px] tw-flex tw-items-center tw-justify-center">
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
                          <AiOutlineLoading3Quarters
                            style={{ fontSize: conversationLoadingIconSize }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
          {fullImageScreen.toggle && (
            <div id="div_fullscreen_image_preview">
              <button
                id="btn_close_fip"
                onClick={() => {
                  setfullImageScreen({
                    preview: "",
                    toggle: false,
                  });
                }}
              >
                <AiOutlineClose
                  style={{
                    fontSize: conversationCloseIconSize,
                  }}
                />
              </button>
              <div
                id="div_fip_onblur"
                onClick={() => {
                  setfullImageScreen({
                    preview: "",
                    toggle: false,
                  });
                }}
              />
              <CachedImage src={fullImageScreen.preview} id="img_fip" />
            </div>
          )}
          <motion.div
            initial={{
              height: "0px",
              paddingTop: "0px",
              paddingBottom: "0px",
              backgroundColor: "white",
              color: "white",
              borderRadius: "10px",
            }}
            animate={{
              height: isReplying.isReply ? "auto" : "0px",
              paddingTop: isReplying.isReply ? "10px" : "0px",
              paddingBottom: isReplying.isReply ? "10px" : "0px",
              borderRadius: "0px",
              backgroundColor: isReplying.isReply
                ? conversationList.filter(
                    (flt: any) => flt.messageID == isReplying.replyingTo,
                  )[0].sender === authentication.user.entity_id
                  ? theme.primary
                  : "white"
                : "white",
              color: isReplying.isReply
                ? conversationList.filter(
                    (flt: any) => flt.messageID == isReplying.replyingTo,
                  )[0].sender === authentication.user.entity_id
                  ? "white"
                  : "black"
                : "white",
            }}
            id="div_selected_images_container"
            className="theme_scroller"
          >
            <div className="tw-w-full tw-flex tw-flex-row">
              <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-gap-[2px] ellipsis-3-lines">
                <span className="cl-text-caption tw-font-semibold tw-font-inter ellipsis-1-line">
                  {isReplying.isReply &&
                    (conversationList.filter(
                      (flt: any) => flt.messageID == isReplying.replyingTo,
                    )[0].sender === authentication.user.entity_id
                      ? "Replying to your message"
                      : `Replying to ${getMemberInfo(
                          conversationList.filter(
                            (flt: any) =>
                              flt.messageID == isReplying.replyingTo,
                          )[0].sender,
                        )}`)}
                </span>
                <span className="cl-text-caption tw-font-inter tw-w-full tw-text-left ellipsis-3-lines">
                  {isReplying.isReply &&
                    (conversationList.filter(
                      (flt: any) => flt.messageID == isReplying.replyingTo,
                    )[0].messageType === "text" ? (
                      <span
                        className="tw-whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: conversationList.filter(
                            (flt: any) =>
                              flt.messageID == isReplying.replyingTo,
                          )[0].content,
                        }}
                      />
                    ) : (
                      `${
                        messageTypeChecker[
                          conversationList
                            .filter(
                              (flt: any) =>
                                flt.messageID == isReplying.replyingTo,
                            )[0]
                            .messageType.split("/")[0]
                        ] || "a file"
                      }`
                    ))}
                </span>
              </div>
              <button
                onClick={() => {
                  setisReplying({ isReply: false, replyingTo: "" });
                }}
                className="btn_remove_preview"
              >
                <AiOutlineClose />
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{
              height: "0px",
              paddingTop: "0px",
              paddingBottom: "0px",
              backgroundColor: "white",
              color: "white",
              borderRadius: "10px",
            }}
            animate={{
              height: isReplying.isReply ? "auto" : "0px",
              paddingTop: isReplying.isReply ? "10px" : "0px",
              paddingBottom: isReplying.isReply ? "10px" : "0px",
              borderRadius: "0px",
              backgroundColor: isReplying.isReply
                ? conversationList.filter(
                    (flt: any) => flt.messageID == isReplying.replyingTo,
                  )[0].sender === authentication.user.entity_id
                  ? theme.primary
                  : "white"
                : "white",
              color: isReplying.isReply
                ? conversationList.filter(
                    (flt: any) => flt.messageID == isReplying.replyingTo,
                  )[0].sender === authentication.user.entity_id
                  ? "white"
                  : "black"
                : "white",
            }}
            id="div_selected_images_container"
            className="theme_scroller"
          >
            <div className="tw-w-full tw-flex tw-flex-row">
              <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-gap-[2px] ellipsis-3-lines">
                <span className="cl-text-caption tw-font-semibold tw-font-inter ellipsis-1-line">
                  Use AI Reply Assist
                </span>
              </div>
              <div>
                <button
                  onClick={ReplyAssistProcess}
                  className="tw-border-none tw-p-[6px] tw-min-w-[80px] tw-rounded-lg tw-font-Inter cl-text-caption tw-cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{
              height: "0px",
              paddingTop: "0px",
              paddingBottom: "0px",
            }}
            animate={{
              height: imgList.length || nonImgList.length > 0 ? "auto" : "0px",
              paddingTop:
                imgList.length || nonImgList.length > 0 ? "10px" : "0px",
              paddingBottom:
                imgList.length || nonImgList.length > 0 ? "10px" : "0px",
            }}
            id="div_selected_images_container"
            className="theme_scroller"
          >
            {nonImgList.map((nonimgl: any, i: number) => {
              if (nonimgl.type.includes("video")) {
                return (
                  <div key={`nonimg_${i}`} className="div_img_selected_preview">
                    <div className="div_btn_remove_container">
                      <button
                        onClick={() => {
                          removeSelectedPreviewNonImg(nonimgl.id);
                        }}
                        className="btn_remove_preview"
                      >
                        <AiOutlineClose
                          style={{ fontSize: conversationCloseIconSize }}
                        />
                      </button>
                    </div>
                    <video
                      src={nonimgl.base}
                      className="img_selected_preview"
                      onClick={() => {
                        removeSelectedPreviewNonImg(nonimgl.id);
                      }}
                    />
                  </div>
                );
              } else if (nonimgl.type.includes("audio")) {
                return (
                  <div
                    title={nonimgl.name}
                    key={`nonimg_${i}`}
                    className="div_img_selected_preview_non_img"
                  >
                    <div className="div_btn_remove_container">
                      <button
                        onClick={() => {
                          removeSelectedPreviewNonImg(nonimgl.id);
                        }}
                        className="btn_remove_preview"
                      >
                        <AiOutlineClose
                          style={{ fontSize: conversationCloseIconSize }}
                        />
                      </button>
                    </div>
                    <div className="img_selected_preview tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[7px]">
                      <MdAudiotrack
                        style={{ fontSize: conversationFileIconSize }}
                      />
                      <span className="tw-w-[calc(100%-20px)] cl-text-micro tw-truncate">
                        {nonimgl.name}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    title={nonimgl.name}
                    key={`nonimg_${i}`}
                    className="div_img_selected_preview_non_img"
                  >
                    <div className="div_btn_remove_container">
                      <button
                        onClick={() => {
                          removeSelectedPreviewNonImg(nonimgl.id);
                        }}
                        className="btn_remove_preview"
                      >
                        <AiOutlineClose />
                      </button>
                    </div>
                    <div className="img_selected_preview tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[7px]">
                      <IoDocumentOutline
                        style={{ fontSize: conversationFileIconSize }}
                      />
                      <span className="tw-w-[calc(100%-20px)] cl-text-micro tw-truncate">
                        {nonimgl.name}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
            {imgList.map((imgl, i) => {
              return (
                <div key={i} className="div_img_selected_preview">
                  <div className="div_btn_remove_container">
                    <button
                      onClick={() => {
                        removeSelectedPreview(imgl.id);
                      }}
                      className="btn_remove_preview"
                    >
                      <AiOutlineClose />
                    </button>
                  </div>
                  <CachedImage
                    src={imgl.base}
                    className="img_selected_preview"
                  />
                </div>
              );
            })}
          </motion.div>
          <motion.div
            initial={{
              height: "0px",
              paddingTop: "0px",
              paddingBottom: "0px",
            }}
            animate={{
              height:
                linkPreview.status === "ok" && linkPreview.preview
                  ? "auto"
                  : "0px",
              paddingTop:
                linkPreview.status === "ok" && linkPreview.preview
                  ? "10px"
                  : "0px",
              paddingBottom:
                linkPreview.status === "ok" && linkPreview.preview
                  ? "10px"
                  : "0px",
            }}
            className="tw-w-full tw-overflow-hidden tw-px-[10px]"
          >
            {linkPreview.status === "ok" && linkPreview.preview && (
              <LinkPreviewCard
                preview={linkPreview.preview}
                variant="composer"
                onRemove={linkPreview.dismiss}
              />
            )}
          </motion.div>
          <div id="div_send_controls">
            {conversationType !== "conference" && (
              <div id="div_options_send">
                <motion.button
                  whileHover={{
                    backgroundColor: isLoading ? "transparent" : "#e6e6e6",
                    cursor: isLoading ? "default" : "pointer",
                  }}
                  disabled={isConversationDisabled}
                  onClick={() => {
                    sendNonImageFilesProcess();
                  }}
                  className="btn_options_send"
                >
                  <RiAddCircleFill
                    style={{
                      fontSize: conversationComposerIconSize,
                      color: "#90caf9",
                    }}
                  />
                </motion.button>
                <motion.button
                  whileHover={{
                    backgroundColor: isLoading ? "transparent" : "#e6e6e6",
                    cursor: isLoading ? "default" : "pointer",
                  }}
                  disabled={isConversationDisabled}
                  onClick={() => {
                    sendImageProcess();
                  }}
                  className="btn_options_send"
                >
                  <FcAddImage
                    style={{ fontSize: conversationComposerIconSize }}
                  />
                </motion.button>
                {canSendVoiceMessage && (
                  <motion.button
                    whileHover={{
                      backgroundColor: isLoading ? "transparent" : "#e6e6e6",
                      cursor: isLoading ? "default" : "pointer",
                    }}
                    disabled={isConversationDisabled}
                    onClick={() => {
                      if (isRecordingVoice) {
                        stopVoiceRecording();
                      } else {
                        startVoiceRecording();
                      }
                    }}
                    className="btn_options_send"
                  >
                    {isRecordingVoice ? (
                      <MdStop
                        style={{
                          fontSize: conversationComposerIconSize,
                          color: "#e53935",
                        }}
                      />
                    ) : (
                      <MdMic
                        style={{
                          fontSize: conversationComposerIconSize,
                          color: "#90caf9",
                        }}
                      />
                    )}
                  </motion.button>
                )}
              </div>
            )}
            <div
              id="div_input_text_content"
              className="cl-conversation-composer"
            >
              {mentionState.open && mentionSuggestions.length > 0 && (
                <div className="cl-mention-suggestion-panel">
                  {mentionSuggestions.map((member, index) => (
                    <button
                      key={member._id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMentionAtCursor(member);
                      }}
                      className={`cl-mention-suggestion-item ${
                        index === mentionActiveIndex
                          ? "cl-mention-suggestion-item--active"
                          : ""
                      }`}
                    >
                      <Avatar
                        id={member._id}
                        name={member.mentionLabel}
                        src={member.profile}
                        size={28}
                      />
                      <span>{member.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                // type="text"
                ref={inputMessageRef}
                autoComplete="off"
                id="input_text_content_send"
                onKeyDown={(e) => {
                  if (mentionState.open && mentionSuggestions.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setMentionActiveIndex((prev) =>
                        prev + 1 >= mentionSuggestions.length ? 0 : prev + 1,
                      );
                      return;
                    }

                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setMentionActiveIndex((prev) =>
                        prev - 1 < 0 ? mentionSuggestions.length - 1 : prev - 1,
                      );
                      return;
                    }

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      insertMentionAtCursor(
                        mentionSuggestions[mentionActiveIndex] ??
                          mentionSuggestions[0],
                      );
                      return;
                    }

                    if (e.key === "Escape") {
                      e.preventDefault();
                      closeMentionSuggestions();
                      return;
                    }
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessageProcess();
                  }
                }}
                onClick={(e) => {
                  const target = e.currentTarget;
                  updateMentionSuggestions(
                    target.value,
                    target.selectionStart ?? target.value.length,
                  );
                }}
                onKeyUp={(e) => {
                  const target = e.currentTarget;
                  updateMentionSuggestions(
                    target.value,
                    target.selectionStart ?? target.value.length,
                  );
                }}
                className="tw-font-Inter tw-resize-none tw-h-auto tw-whitespace-pre-line"
                disabled={isConversationDisabled}
                placeholder="Write a message...."
                value={messageValue}
                onChange={(e) => {
                  if (!isalreadytyping && e.target.value !== "") {
                    setisalreadytyping(true);
                    IsTypingBroadcastRequest({
                      conversationID: conversationID,
                      receivers: conversationinfo?.users.map(
                        (mp: any) => mp._id,
                      ),
                    });
                  }
                  setmessageValue(e.target.value);
                  updateMentionSuggestions(
                    e.target.value,
                    e.target.selectionStart ?? e.target.value.length,
                  );
                }}
                onBlur={() => {
                  setTimeout(() => {
                    closeMentionSuggestions();
                  }, 120);
                }}
              ></textarea>
            </div>
            <div id="div_confirm_send">
              <motion.button
                whileHover={{
                  backgroundColor: isLoading ? "transparent" : "#e6e6e6",
                  cursor: isLoading ? "default" : "pointer",
                }}
                onClick={() => {
                  sendMessageProcess();
                }}
                disabled={isConversationDisabled}
                className={`btn_options_send ${
                  isServerConversation
                    ? "cl-conversation-send-button--server"
                    : ""
                }`}
              >
                <IoSend
                  style={{
                    fontSize: conversationComposerIconSize,
                    color: isServerConversation ? "var(--on-brand)" : "white",
                  }}
                />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
    </>
  );
}

export default memo(
  ConversationV2,
  (prevProps, nextProps) =>
    prevProps.isMinimized === nextProps.isMinimized &&
    prevProps.theme.primary === nextProps.theme.primary &&
    prevProps.theme.lighten === nextProps.theme.lighten &&
    prevProps.conversationID === nextProps.conversationID,
);
