/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BiSolidPhoneCall } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { InitConversationListRequest } from "../../../reusables/hooks/requests";
import GroupChatIcon from "../../../assets/imgs/group-chat-icon.jpg";
import ServerIcon from "../../../assets/imgs/servericon.png";
import {
  SET_CONVERSATION_SETUP,
  SET_MESSAGES_LIST,
  SET_MESSAGES_LIST_OVERRIDE,
  SET_PREVIEW_PARTICIPANTS_BULK,
} from "../../../redux/types";
import CreateGroupChatModal from "../../widgets/modals/CreateGroupChatModal";
import { conversationsetupstate } from "../../../redux/actions/states";
import { isUserOnline, timeSince } from "../../../reusables/hooks/reusable";
import CreateServerModal from "@/app/widgets/modals/CreateServerModal";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import MessageItemLoader from "@/app/reusables/loaders/MessageItemLoader";
import {
  AuthenticationInterface,
  IConversation,
  IPreviewParicipants,
  IUserSettings,
} from "@/reusables/vars/interfaces";
import {
  getSettings,
  persistSettings,
} from "@/reusables/hooks/localforagehelper";
import {
  Avatar,
  Btn,
  Card,
  Field,
  Icon,
  IconBtn,
  Chip,
  SegTabs,
  useTheme,
} from "@/reusables/design";
import MessagesDefault from "../messenger/MessagesDefault";
import ConversationV2 from "../messenger/ConversationV2";

const TYPE_CHECKER: Record<string, string> = {
  video: "a video",
  audio: "an audio",
  image: "a photo",
  any: "a file",
};

function lastMessagePreview(
  msgslst: IConversation,
  authUserID: string,
): { text: string; html?: boolean } {
  const senderPrefix = msgslst.sender == authUserID ? "you: " : "";
  if (msgslst.isDeleted) {
    return { text: `${senderPrefix}[Deleted message]` };
  }
  if (msgslst.messageType === "text" || msgslst.messageType === "notif") {
    return { text: `${senderPrefix}${msgslst.content || ""}`, html: true };
  }
  if (
    !msgslst.messageType.includes("image") &&
    !msgslst.messageType.includes("video") &&
    !msgslst.messageType.includes("audio")
  ) {
    return { text: `${senderPrefix}Sent ${TYPE_CHECKER["any"]}` };
  }
  return {
    text: `${senderPrefix}Sent ${TYPE_CHECKER[msgslst.messageType.split("/")[0]]}`,
  };
}

function timestampLabel(msgslst: IConversation): string {
  return timeSince(msgslst.messageDate);
}

function MessageRow({
  imgSrc,
  title,
  titleColor,
  titleIcon,
  subtitle,
  subtitleColor,
  subtitleHtml,
  time,
  unread,
  showOnline,
  showCall,
  active,
  onClick,
  style,
}: {
  imgSrc: string | null | undefined;
  title: string;
  titleColor?: string;
  titleIcon?: string;
  subtitle: string;
  subtitleColor?: string;
  subtitleHtml?: boolean;
  time: string;
  unread: number;
  showOnline?: boolean;
  showCall?: boolean;
  active?: boolean;
  onClick: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        padding: "12px",
        border: "1px solid",
        borderColor: active ? "var(--brand-soft)" : "transparent",
        borderRadius: "var(--r-md)",
        cursor: "pointer",
        textAlign: "left",
        background: active ? "var(--brand-soft)" : "transparent",
        boxShadow: active ? "var(--shadow-sm)" : "none",
        transition: "background .14s",
        ...style,
      }}
      onMouseEnter={(e) =>
        !active && (e.currentTarget.style.background = "var(--surface-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = active
          ? "var(--brand-soft)"
          : "transparent")
      }
    >
      <div style={{ position: "relative", flex: "none" }}>
        <Avatar id={title} name={title} src={imgSrc || undefined} size={46} />
        {showOnline && (
          <span
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "var(--online)",
              border: "2px solid var(--surface)",
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: titleColor || "var(--text)",
              fontWeight: 700,
              fontSize: 14,
              minWidth: 0,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {title}
            </span>
            {titleIcon && <Icon n={titleIcon} s={15} c={titleColor} />}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", flex: "none" }}>
            {time}
          </div>
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: subtitleColor || "var(--text-2)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
          {...(subtitleHtml
            ? { dangerouslySetInnerHTML: { __html: subtitle } }
            : { children: subtitle })}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flex: "none",
        }}
      >
        {unread > 0 && (
          <span
            style={{
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              background: "var(--brand)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread}
          </span>
        )}
        {showCall && <BiSolidPhoneCall color="var(--green)" />}
      </div>
    </button>
  );
}

function Messages() {
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [isCreateGCToggle, setisCreateGCToggle] = useState<boolean>(false);
  const [isCreateServerToggle, setisCreateServerToggle] =
    useState<boolean>(false);
  const [conversationTypeSet, setconversationTypeSet] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toggleComposeMenu, setToggleComposeMenu] = useState<boolean>(false);

  const previewparticipants: IPreviewParicipants[] = useSelector(
    (state: any) => state.previewparticipants,
  );
  const usersettings: IUserSettings = useSelector(
    (state: any) => state.usersettings,
  );

  const getChannelPreviewParticipants = (channelID: string) =>
    previewparticipants.filter((flt) => flt.channelID === channelID);

  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const conversationsetup = useSelector(
    (state: any) => state.conversationsetup,
  );
  const messageslist: IConversation[] = useSelector(
    (state: any) => state.messageslist,
  );
  const istypinglist = useSelector((state: any) => state.istypinglist);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [page, setpage] = useState<number>(1);
  const [range] = useState<number>(20);
  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);
  const [isNext, setisNext] = useState<boolean>(true);

  const conversationPath = useLocation().pathname;

  useEffect(() => {
    if (authentication.user.entity_id) {
      getSettings(authentication.user.entity_id)
        .then((value) => {
          if (value?.messages?.type) {
            setconversationTypeSet(
              value.messages.type === "common" ? "all" : value.messages.type,
            );
          } else {
            setconversationTypeSet("all");
          }
        })
        .catch((err) => console.log(err));
    }
  }, [authentication]);

  useEffect(() => {
    let currentView = false;
    if (divcontentRef.current) {
      divcontentRef.current.onscroll = () => {
        if (divlazyloaderRef.current) {
          const top = divlazyloaderRef.current.getBoundingClientRect().top;
          const isVisible = top >= 0 && top <= window.innerHeight;
          if (currentView != isVisible) {
            currentView = isVisible;
            if (currentView) setpage((prev) => prev + 1);
          }
        }
      };
    }
  }, [conversationsetup, isLoading]);

  useEffect(() => {
    InitConversationListRequest(page, range).then((response) => {
      setisNext(response.next);
      dispatch({
        type: SET_PREVIEW_PARTICIPANTS_BULK,
        payload: {
          participants: response.items
            .map((mp: any) => mp.voice_participants)
            .flat(),
        },
      });
      dispatch({
        type: SET_MESSAGES_LIST,
        payload: { messageslist: response.items },
      });
      setisLoading(false);
    });
  }, [page]);

  const navigateToConversation = (
    type: any,
    conversationID: any,
    userdetails: any,
  ) => {
    if (type == "single") {
      dispatch({
        type: SET_CONVERSATION_SETUP,
        payload: {
          conversationsetup: {
            conversationid: conversationID,
            userdetails,
            groupdetails: conversationsetupstate.groupdetails,
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
            userdetails: conversationsetupstate.userdetails,
            groupdetails: userdetails,
            type: "group",
          },
        },
      });
    }
  };

  const setConversationListGroups = (type: string) => {
    if (authentication.user.entity_id) {
      const storedType = type === "all" ? "common" : type;
      persistSettings(authentication.user.entity_id, {
        ...usersettings,
        messages: { ...usersettings.messages, type: storedType },
      })
        .then(() => {
          setconversationTypeSet(type);
          dispatch({
            type: SET_MESSAGES_LIST_OVERRIDE,
            payload: { messageslist: [] },
          });
          setisLoading(true);
          InitConversationListRequest(1, range).then((response) => {
            setisNext(response.next);
            setpage(2);
            dispatch({
              type: SET_PREVIEW_PARTICIPANTS_BULK,
              payload: {
                participants: response.items
                  .map((mp: any) => mp.voice_participants)
                  .flat(),
              },
            });
            dispatch({
              type: SET_MESSAGES_LIST_OVERRIDE,
              payload: { messageslist: response.items },
            });
            setisLoading(false);
          });
        })
        .catch((err) => console.log(err));
    }
  };

  const isStandalone = pathnamelistener.includes("messages");
  const isMobile = screensizelistener.W <= 900;
  const visibleConversationType =
    conversationTypeSet === "common" ? "all" : conversationTypeSet;

  const visibleMessages: IConversation[] = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = (value: string) =>
      query === "" || value.toLowerCase().includes(query);

    return messageslist.filter((msgslst: IConversation) => {
      const isDirect = msgslst.conversationType === "single";
      const isGroup = msgslst.conversationType === "group";
      const isServerConversation = msgslst.conversationType === "channel";

      const matchesType =
        visibleConversationType === "all" ||
        (visibleConversationType === "direct" && isDirect) ||
        (visibleConversationType === "groups" && isGroup) ||
        (visibleConversationType === "servers" && isServerConversation);

      if (!matchesType) return false;

      const last = lastMessagePreview(msgslst, authentication.user.entity_id);
      const title = msgslst.details.display_name;

      return matchesSearch(title) || matchesSearch(last.text);
    });
  }, [
    messageslist,
    authentication.user.entity_id,
    searchQuery,
    visibleConversationType,
  ]);

  const conversationTheme = useMemo(
    () => ({ primary: "#1c7def", lighten: "#82b7f6" }),
    [],
  );

  const MessagesSplitShell = () => (
    <>
      {isCreateGCToggle && (
        <CreateGroupChatModal setisCreateGCToggle={setisCreateGCToggle} />
      )}
      {isCreateServerToggle && (
        <CreateServerModal setisCreateServerToggle={setisCreateServerToggle} />
      )}
      <div
        className="cl-redesign"
        data-theme={theme}
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flex: 1,
          minHeight: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            display:
              isMobile && conversationPath.split("/").length >= 3
                ? "none"
                : "flex",
            width: isMobile ? "100%" : "clamp(320px, 34vw, 390px)",
            flexDirection: "column",
            minHeight: 0,
            background: "var(--surface)",
            borderRight: isMobile ? "none" : "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            zIndex: 1,
          }}
        >
          <div
            className="cl-messages-shell__header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "18px 18px 12px",
            }}
          >
            <div
              className="cl-messages-shell__title"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <span
                style={{
                  width: isMobile ? 34 : 38,
                  height: isMobile ? 34 : 38,
                  borderRadius: "var(--r-sm)",
                  background: "var(--brand-soft)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon n="forum" s={isMobile ? 16 : 18} c="var(--brand)" />
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                Messages
              </h2>
            </div>
            <div
              className="cl-messages-shell__compose"
              style={{ position: "relative" }}
            >
              <IconBtn
                n="edit_square"
                size={isMobile ? 34 : 38}
                s={isMobile ? 18 : 20}
                title="Create chat"
                onClick={() => setToggleComposeMenu((prev) => !prev)}
              />
              {toggleComposeMenu && (
                <Card
                  pad={8}
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    minWidth: 180,
                    zIndex: 20,
                  }}
                >
                  <Btn
                    block
                    variant="ghost"
                    size="sm"
                    iconL="group_add"
                    style={{ justifyContent: "flex-start" }}
                    onClick={() => {
                      setToggleComposeMenu(false);
                      setisCreateGCToggle(true);
                    }}
                  >
                    Create Group
                  </Btn>
                  <Btn
                    block
                    variant="ghost"
                    size="sm"
                    iconL="dns"
                    style={{ justifyContent: "flex-start" }}
                    onClick={() => {
                      setToggleComposeMenu(false);
                      setisCreateServerToggle(true);
                    }}
                  >
                    Create Server
                  </Btn>
                </Card>
              )}
            </div>
          </div>

          <div
            className="cl-messages-shell__search"
            style={{ padding: isMobile ? "0 14px 10px" : "0 18px 12px" }}
          >
            <Field
              icon="search"
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </div>

          <div
            className="cl-messages-shell__tabs"
            style={{ padding: isMobile ? "0 14px 12px" : "0 18px 14px" }}
          >
            <SegTabs
              tabs={[
                { key: "all", label: "All" },
                { key: "direct", label: "Direct" },
                { key: "groups", label: "Groups" },
              ]}
              value={visibleConversationType}
              onChange={(k) => setConversationListGroups(k)}
              style={{ width: "100%" }}
            />
          </div>

          <div
            ref={divcontentRef}
            className="cl-messages-shell__list"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: isMobile ? "0 12px 12px" : "0 14px 14px",
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 6 : 8,
            }}
          >
            {isLoading ? (
              Array.from({ length: 12 }, (_, i) => (
                <MessageItemLoader key={i} />
              ))
            ) : visibleMessages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 280,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: "var(--text-3)",
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <Icon n="forum" s={42} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  No conversations found
                </span>
              </div>
            ) : (
              <>
                {visibleMessages.flatMap((msgslst: IConversation) => {
                  const typingHere =
                    istypinglist.filter(
                      (flt: any) =>
                        flt.conversationID === msgslst.conversationID,
                    ).length > 0;
                  const callHere =
                    getChannelPreviewParticipants(msgslst.conversationID)
                      .length > 0;
                  const active =
                    conversationsetup.conversationid === msgslst.conversationID;

                  const last = lastMessagePreview(
                    msgslst,
                    authentication.user.entity_id,
                  );

                  return (
                    <MessageRow
                      key={`${msgslst.conversationID}`}
                      imgSrc={
                        msgslst.details.profile === "none"
                          ? undefined
                          : msgslst.details.profile
                      }
                      title={msgslst.details.display_name}
                      subtitle={typingHere ? "is typing…" : last.text}
                      subtitleColor={typingHere ? "var(--brand)" : undefined}
                      subtitleHtml={!typingHere && last.html}
                      time={timestampLabel(msgslst)}
                      unread={msgslst.unread || 0}
                      showOnline={isUserOnline(
                        activeuserslist,
                        msgslst.details.entity_id,
                      )}
                      showCall={callHere}
                      active={active}
                      onClick={() => {
                        navigate(`/messages/${msgslst.conversationID}`);
                      }}
                      style={{ marginBottom: 2 }}
                    />
                  );
                })}
                {isNext && (
                  <div
                    ref={divlazyloaderRef}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: 16,
                      color: "var(--text-3)",
                    }}
                  >
                    <AiOutlineLoading3Quarters
                      className="cl-spin"
                      style={{ fontSize: 22 }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            minWidth: 0,
            flexDirection: "column",
            minHeight: 0,
            background: "var(--surface-2)",
            width: isMobile ? "100%" : undefined,
            alignSelf: "stretch",
          }}
        >
          <Routes>
            {!isMobile && <Route path="/" element={<MessagesDefault />} />}
            <Route
              path="/:conversationID"
              element={<ConversationV2 theme={conversationTheme} />}
            />
          </Routes>
        </div>
      </div>
    </>
  );

  return MessagesSplitShell();

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
        maxWidth: isStandalone ? 640 : "100%",
        margin: isStandalone ? "0 auto" : undefined,
        padding: isStandalone ? "16px 22px" : "16px 12px",
        gap: 12,
        background: "transparent",
      }}
    >
      {isCreateGCToggle && (
        <CreateGroupChatModal setisCreateGCToggle={setisCreateGCToggle} />
      )}
      {isCreateServerToggle && (
        <CreateServerModal setisCreateServerToggle={setisCreateServerToggle} />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: isStandalone ? 0 : "0 4px",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--r-sm)",
            background: "var(--brand-soft)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon n="forum" s={18} c="var(--brand)" />
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: isStandalone ? 22 : 17,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            flex: 1,
          }}
        >
          Messages
        </h2>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Btn
          size="sm"
          variant="soft"
          iconL="group_add"
          onClick={() => setisCreateGCToggle(true)}
          style={{ flex: 1, justifyContent: "center" }}
        >
          Create Group
        </Btn>
        <Btn
          size="sm"
          variant="soft"
          iconL="dns"
          onClick={() => setisCreateServerToggle(true)}
          style={{
            flex: 1,
            justifyContent: "center",
            background: "var(--gold-soft)",
            color: "var(--gold)",
          }}
        >
          Create Server
        </Btn>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {(
          [
            ["all", "All"],
            ["common", "Common"],
            ["direct", "Direct"],
            ["groups", "Groups"],
            ["servers", "Servers"],
          ] as const
        ).map(([k, l]) => (
          <Chip
            key={k}
            active={conversationTypeSet === k}
            onClick={() => setConversationListGroups(k)}
          >
            {l}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <MessageItemLoader key={i} />
          ))}
        </div>
      ) : messageslist.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "var(--text-3)",
          }}
        >
          <Icon n="chat_bubble_outline" s={42} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>No messages</span>
        </div>
      ) : (
        <div
          ref={divcontentRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {messageslist.flatMap((msgslst: any, i: number) => {
            const typingHere =
              istypinglist.filter(
                (flt: any) => flt.conversationID === msgslst.conversationID,
              ).length > 0;
            const callHere =
              getChannelPreviewParticipants(msgslst.conversationID).length > 0;

            if (msgslst.conversationType === "single") {
              return msgslst.users
                .filter((u: any) => u._id !== authentication.user.userID)
                .map((msgsurs: any, j: number) => {
                  const name = `${msgsurs.fullname.firstName}${
                    msgsurs.fullname.middleName === "N/A"
                      ? ""
                      : ` ${msgsurs.fullname.middleName}`
                  } ${msgsurs.fullname.lastName}`;
                  const last = lastMessagePreview(
                    msgslst,
                    authentication.user.userID,
                  );
                  return (
                    <MessageRow
                      key={`${i}-${j}`}
                      imgSrc={
                        msgsurs.profile === "none" ? undefined : msgsurs.profile
                      }
                      title={name}
                      subtitle={typingHere ? "is typing…" : last.text}
                      subtitleColor={typingHere ? "var(--brand)" : undefined}
                      subtitleHtml={!typingHere && last.html}
                      time={timestampLabel(msgslst)}
                      unread={msgslst.unread || 0}
                      showOnline={isUserOnline(activeuserslist, msgsurs._id)}
                      showCall={callHere}
                      onClick={() =>
                        navigateToConversation(
                          "single",
                          msgslst.conversationID,
                          msgsurs,
                        )
                      }
                    />
                  );
                });
            }

            if (msgslst.conversationType === "group") {
              const last = lastMessagePreview(
                msgslst,
                authentication.user.userID,
              );
              const img =
                msgslst.groupdetails?.profile &&
                msgslst.groupdetails.profile !== "N/A"
                  ? msgslst.groupdetails.profile
                  : GroupChatIcon;
              return [
                <MessageRow
                  key={i}
                  imgSrc={img}
                  title={msgslst.groupdetails.groupName}
                  titleColor="var(--brand)"
                  titleIcon="group"
                  subtitle={typingHere ? "someone is typing…" : last.text}
                  subtitleColor={typingHere ? "var(--brand)" : undefined}
                  subtitleHtml={!typingHere && last.html}
                  time={timestampLabel(msgslst)}
                  unread={msgslst.unread || 0}
                  showCall={callHere}
                  onClick={() =>
                    navigateToConversation("group", msgslst.conversationID, {
                      ...msgslst.groupdetails,
                      receivers: msgslst.receivers,
                    })
                  }
                />,
              ];
            }

            if (msgslst.conversationType === "channel") {
              const last = lastMessagePreview(
                msgslst,
                authentication.user.userID,
              );
              const img =
                msgslst.serverdetails?.profile &&
                msgslst.serverdetails.profile !== "N/A"
                  ? msgslst.serverdetails.profile
                  : ServerIcon;
              const title = `${msgslst.serverdetails?.serverName} · ${msgslst.groupdetails.groupName}`;
              return [
                <MessageRow
                  key={i}
                  imgSrc={img}
                  title={title}
                  titleColor="var(--gold)"
                  titleIcon="dns"
                  subtitle={typingHere ? "someone is typing…" : last.text}
                  subtitleColor={typingHere ? "var(--brand)" : undefined}
                  subtitleHtml={!typingHere && last.html}
                  time={timestampLabel(msgslst)}
                  unread={msgslst.unread || 0}
                  onClick={() =>
                    navigate(
                      `/servers/${msgslst.serverdetails?.serverID}/${msgslst.groupdetails.groupID}`,
                    )
                  }
                />,
              ];
            }
            return [];
          })}
          {isNext && (
            <div
              ref={divlazyloaderRef}
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 16,
                color: "var(--text-3)",
              }}
            >
              <AiOutlineLoading3Quarters
                className="cl-spin"
                style={{ fontSize: 22 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Messages;
