/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../../styles/styles.css";
import { motion } from "framer-motion";
import { FcVideoCall, FcAddImage } from "react-icons/fc"; //FcInfo
import { BiSolidInfoCircle, BiSolidPhoneCall, BiWindows } from "react-icons/bi";
import {
  RiAddCircleFill,
  RiInboxArchiveFill,
  RiInboxUnarchiveFill,
} from "react-icons/ri";
import { IoArrowBack, IoDocumentOutline, IoSend } from "react-icons/io5";
import { MdAudiotrack, MdDelete } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai"; //AiFillInfoCircle
import { checkIfValid } from "../../../reusables/hooks/validatevariables";
import {
  CallRequest,
  ConversationInfoRequest,
  InitConversationInfoRequest,
  InitConversationListRequest,
  InitConversationRequest,
  IsTypingBroadcastRequest,
  SeenMessageRequest,
  SendFilesRequest,
  SendMessageRequest,
  UpdateChatHistoryRequest,
} from "../../../reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  importData,
  importNonImageData,
  isUserOnline,
  makeid,
  sanitizeForStorage,
  timeSince,
} from "../../../reusables/hooks/reusable";
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
  SET_MINIMIZED_CONVERSATION,
  SET_MUTATE_ALERTS,
  SET_PENDING_MESSAGES_LIST,
  SET_PREVIEW_PARTICIPANTS_BULK,
} from "../../../redux/types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ContentHandler from "./partials/ContentHandler";
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
  const [imgList, setimgList] = useState<any[]>([]);
  const [rawFilesList, setrawFilesList] = useState<any[]>([]);
  const [nonImgList, setnonImgList] = useState<any[]>([]);
  const [nonImageRawFilesList, setnonImageRawFilesList] = useState<any[]>([]);

  const [page, setpage] = useState<number>(1);
  const [range, setrange] = useState<number>(20);
  const [incrementer, setincrementer] = useState<number>(1);

  const [toggleConversationInfoModal, settoggleConversationInfoModal] =
    useState<boolean>(false);
  const [conversationinfo, setconversationinfo] =
    useState<ConversationInfoInterface | null>(null);
  const [toggleMenu, settoggleMenu] = useState<boolean>(false);
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
      const pendingArrImages = [...imgList, ...nonImgList].map(
        (mp: any, i: number) => ({
          conversationID: conversationID,
          pendingID: `${pendingID}_${i}`,
          reference: mp.base,
          referenceMediaType: mp.type,
          type: mp.type,
          name: mp.name,
        }),
      );

      if (conversationsetup.conversationType == "single") {
        addMultiplePendingMessage([
          ...pendingArrImages.map((mp) => ({
            ...mp,
            content: mp.reference,
            reference: null,
          })),
        ]);
        SendFilesRequest({
          conversationID: conversationID,
          receivers: conversationinfo?.users.map((mp: any) => mp._id),
          files: pendingArrImages,
          isReply: isReplying.isReply,
          replyingTo: isReplying.replyingTo,
          conversationType: conversationType,
        });
      } else {
        addMultiplePendingMessage([
          ...pendingArrImages.map((mp) => ({
            ...mp,
            content: mp.reference,
            reference: null,
          })),
        ]);
        SendFilesRequest({
          conversationID: conversationID,
          receivers: conversationinfo?.users.map((mp: any) => mp._id),
          files: pendingArrImages,
          isReply: isReplying.isReply,
          replyingTo: isReplying.replyingTo,
          conversationType: conversationType,
        });
      }
      setimgList([]);
      setnonImgList([]);
      setrawFilesList([]);
      setnonImageRawFilesList([]);
    }

    setmessageValue("");
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

  const sendImageProcess = () => {
    importData(
      (arr: any) => {
        setimgList((prev: any) => [
          ...prev,
          {
            id: prev.length + 1,
            name: arr.name,
            base: arr.data,
            type: "image",
          },
        ]);
      },
      (rawFiles: any) => {
        setrawFilesList((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            name: rawFiles.name,
            base: rawFiles.data,
            type: "image",
          },
        ]);
      },
    );
  };

  const removeSelectedPreview = (prevID: any) => {
    const mutatedPrevArr = imgList.filter((flt) => flt.id != prevID);
    const mutatedPrevRaw = rawFilesList.filter((flt) => flt.id != prevID);
    setimgList(mutatedPrevArr);
    setrawFilesList(mutatedPrevRaw);
  };

  const removeSelectedPreviewNonImg = (prevID: any) => {
    const mutatedPrevArr = nonImgList.filter((flt) => flt.id != prevID);
    const mutatedPrevRaw = nonImageRawFilesList.filter(
      (flt) => flt.id != prevID,
    );
    setnonImgList(mutatedPrevArr);
    setnonImageRawFilesList(mutatedPrevRaw);
  };

  const sendNonImageFilesProcess = () => {
    importNonImageData(
      (arr: any) => {
        if (arr) {
          if (arr.type.includes("image")) {
            setimgList((prev: any) => [
              ...prev,
              {
                id: prev.length + 1,
                name: arr.name,
                base: arr.data,
                type: "image",
              },
            ]);
          } else {
            setnonImgList((prev: any) => [
              ...prev,
              {
                id: prev.length + 1,
                base: arr.data,
                type: arr.type,
                name: arr.name,
              },
            ]);
          }
        } else {
          dispatch({
            type: SET_MUTATE_ALERTS,
            payload: {
              alerts: {
                type: "warning",
                content: "Cannot upload files greater than 25mb",
              },
            },
          });
        }
      },
      (rawFiles: any) => {
        if (rawFiles) {
          if (rawFiles.type.includes("image")) {
            setrawFilesList((prev) => [
              ...prev,
              {
                id: prev.length + 1,
                name: rawFiles.name,
                base: rawFiles.data,
                type: "image",
              },
            ]);
          } else {
            // console.log(rawFiles)
            setnonImageRawFilesList((prev: any) => [
              ...prev,
              {
                id: prev.length + 1,
                base: rawFiles.data,
                type: rawFiles.type,
                name: rawFiles.name,
              },
            ]);
          }
        }
      },
    );
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
        displayImage:
          conversationsetup.conversationType == "single"
            ? conversationsetup?.details.profile
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
          className={`tw-border-[0px] ${
            isMinimized &&
            "cl-conversation-window-shell tw-shadow-md tw-border-[1px] tw-border-[#dedede]"
          }`}
        >
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
                  <span
                    className="span_userdetails_name tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                    onClick={() => {
                      navigate(`/${conversationsetup.details.username}`);
                    }}
                  >
                    {conversationsetup.details.display_name}
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
                    conversationType !== "conference" && (
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
                    conversationType !== "conference" && (
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
                        <span className="tw-text-[11px] tw-font-Inter">
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
                            <span className="tw-text-[11px] tw-font-Inter">
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
                            <span className="tw-text-[11px] tw-font-Inter">
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
                              <span className="tw-text-[11px] tw-font-Inter">
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
                              <span className="tw-text-[11px] tw-font-Inter">
                                Archive
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
                            <span className="tw-text-[11px] tw-font-Inter">
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
                          <span className="tw-text-[11px] tw-font-Inter">
                            Close
                          </span>
                        </motion.button>
                      )}
                    </motion.div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
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
                          <span className="span_sending_label">Sending...</span>
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
                          <span className="span_sending_label">...Sending</span>
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
                          <span className="span_sending_label">...Sending</span>
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
                          className="tw-flex tw-flex-col tw-w-full tw-max-w-[70%]"
                        >
                          <div className="div_pending_audio_content_container_sending">
                            <audio
                              src={cnvs.content}
                              controls
                              className="tw-w-full tw-border-[7px]"
                              onLoad={() => {
                                scrollBottom();
                              }}
                            />
                          </div>
                          <span className="span_sending_label">...Sending</span>
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
                            <span className="tw-text-[12px] tw-break-all ellipsis-3-lines tw-font-semibold">
                              {cnvs.name}
                            </span>
                          </div>
                          <span className="span_sending_label">...Sending</span>
                        </motion.div>
                      </motion.div>
                    );
                  }
                })}
              {getChannelPreviewParticipants(conversationID).length > 0 &&
                conversationType !== "conference" && (
                  <div className="div_messages_result tw-w-[calc(100%-20px)] tw-flex tw-justify-center tw-p-[10px]">
                    <div className="tw-bg-[#f0f2f5] tw-w-[calc(100%-20px)] tw-max-w-[calc(400px-20px)] tw-p-[10px] tw-rounded-md">
                      <div className="tw-w-full tw-flex tw-flex-col">
                        <span className="tw-text-[14px] tw-font-semibold tw-font-Inter">
                          Ongoing Call
                        </span>
                      </div>
                      <div className="tw-w-full tw-flex tw-flex-col tw-h-[40px] tw-justify-center">
                        <span className="tw-text-[12px] tw-font-Inter">
                          {getChannelPreviewParticipants(conversationID)
                            .length === 1
                            ? `@${
                                getChannelPreviewParticipants(conversationID)[0]
                                  .username
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
                          style={{ backgroundColor: "#dedede" }}
                          onClick={() => {
                            initializeCall("audio");
                          }}
                          className="tw-p-[6px] tw-w-full tw-rounded-md tw-border-none tw-text-[14px] tw-text-white tw-font-semibold tw-cursor-pointer"
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
              {conversationList.length > 0 && totalMessages > page * range && (
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
              borderRadius: "10px",
              backgroundColor: isReplying.isReply
                ? conversationList.filter(
                    (flt: any) => flt.messageID == isReplying.replyingTo,
                  )[0].sender === authentication.user.userID
                  ? theme.primary
                  : "#dedede"
                : "white",
              color: isReplying.isReply
                ? conversationList.filter(
                    (flt: any) => flt.messageID == isReplying.replyingTo,
                  )[0].sender === authentication.user.userID
                  ? "white"
                  : "black"
                : "white",
            }}
            id="div_selected_images_container"
            className="theme_scroller"
          >
            <div className="tw-w-full tw-flex tw-flex-row">
              <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-gap-[2px] ellipsis-3-lines">
                <span className="tw-text-[12px] tw-font-semibold tw-font-inter ellipsis-1-line">
                  {isReplying.isReply &&
                    (conversationList.filter(
                      (flt: any) => flt.messageID == isReplying.replyingTo,
                    )[0].sender === authentication.user.userID
                      ? "Replying to your message"
                      : `Replying to ${getMemberInfo(
                          conversationList.filter(
                            (flt: any) =>
                              flt.messageID == isReplying.replyingTo,
                          )[0].sender,
                        )}`)}
                </span>
                <span className="tw-text-[12px] tw-font-inter tw-w-full tw-text-left ellipsis-3-lines">
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
                      <span className="tw-w-[calc(100%-20px)] tw-text-[10px] tw-truncate">
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
                      <span className="tw-w-[calc(100%-20px)] tw-text-[10px] tw-truncate">
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
