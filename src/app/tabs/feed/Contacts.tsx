/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import {
  ContactsListInitRequest,
  DeclineContactRequest,
} from "../../../reusables/hooks/requests";
import DefaultProfile from "../../../assets/imgs/default.png";
import {
  SET_CONVERSATION_SETUP,
  SET_TOGGLE_RIGHT_WIDGET,
} from "../../../redux/types";
import { useNavigate } from "react-router-dom";
import { conversationsetupstate } from "../../../redux/actions/states";
import {
  contactsToUserdetails,
  isUserOnline,
  userSessionStatusFromContacts,
} from "../../../reusables/hooks/reusable";
import { PaginationProp } from "@/reusables/vars/props";
import { AuthenticationInterface, IContact } from "@/reusables/vars/interfaces";
import ContactItemLoader from "@/app/reusables/loaders/ContactItemLoader";
import { Avatar, Icon, IconBtn, useTheme } from "@/reusables/design";

interface ContactRowData {
  id: string;
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  profile: string;
  isBadged?: boolean;
  connectionID: string;
  selfActed: boolean;
  involvedUserdetails: any;
}

function Contacts() {
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const contacts: PaginationProp<IContact> = useSelector(
    (state: any) => state.contactslist,
  );
  const contactslist: IContact[] = contacts.results;
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const alerts = useSelector((state: any) => state.alerts);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const [isLoading, setisLoading] = useState(true);
  const [isDisabledByRequest, setisDisabledByRequest] = useState(false);

  const [page, setpage] = useState(1);
  const [range] = useState(50);

  useEffect(() => {
    ContactsListInitRequest(page, range, false, dispatch, setisLoading);
  }, [page, range]);

  const settogglerightwidget = (toggle: any) => {
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload: { togglerightwidget: toggle },
    });
  };

  const declineRequestProcess = (connection_id: any, action: string) => {
    setisDisabledByRequest(true);
    DeclineContactRequest(
      { connection_id, action },
      dispatch,
      alerts,
      setisDisabledByRequest,
    );
  };

  const navigateToConversation = (
    type: any,
    conversationID: any,
    userdetails: any,
  ) => {
    const isMobile = screensizelistener.W <= 1100;
    const payload =
      type === "single"
        ? {
            conversationid: conversationID,
            userdetails,
            groupdetails: conversationsetupstate.groupdetails,
            type: "single",
          }
        : {
            conversationid: conversationID,
            userdetails: conversationsetupstate.userdetails,
            groupdetails: userdetails,
            type: "group",
          };
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: { conversationsetup: payload },
    });
    if (isMobile) navigate("/messages");
    else settogglerightwidget("messages");
  };

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

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
  }, [isLoading]);

  const isStandalone = pathnamelistener.includes("contacts");
  const isMobile = screensizelistener.W <= 1100;
  if (!isStandalone && isMobile) {
    return null;
  }
  const maxW = isStandalone ? 640 : 360;

  const rows: ContactRowData[] = contactslist.flatMap((cnts) => {
    if (cnts.type !== "single") return [];
    if (!cnts.involved_user || !cnts.action_by) return [];
    const selfActed = cnts.action_by.id === authentication.user.userID;
    const u = selfActed ? cnts.involved_user : cnts.action_by;
    return [
      {
        id: u.id,
        username: u.username,
        firstName: u.first_name,
        middleName: u.middle_name,
        lastName: u.last_name,
        profile: u.profile,
        isBadged: u.is_badged,
        connectionID: cnts.connection_id,
        selfActed,
        involvedUserdetails: contactsToUserdetails(cnts, !selfActed),
      },
    ];
  });

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
        maxWidth: maxW,
        margin: isStandalone ? "0 auto" : undefined,
        padding: isStandalone ? "16px 22px" : "16px 12px",
        gap: 12,
        background: isStandalone ? "transparent" : "var(--surface)",
        borderLeft: !isStandalone ? "1px solid var(--border)" : "none",
      }}
    >
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
            background: "var(--green-soft)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon n="contacts" s={18} c="var(--green)" />
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: isStandalone ? 22 : 17,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Contacts
        </h2>
      </div>

      {isLoading ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <ContactItemLoader key={i} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--text-3)",
          }}
        >
          <Icon n="contacts" s={42} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>No contacts</span>
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
            gap: 4,
            paddingRight: 4,
          }}
        >
          {rows.map((r, i) => {
            const online = isUserOnline(activeuserslist, r.id);
            const sessionStatus = !online
              ? userSessionStatusFromContacts(activeuserslist, r.id)
              : null;
            const fullName = `${r.firstName}${
              r.middleName === "N/A" ? "" : ` ${r.middleName}`
            } ${r.lastName}`;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  transition: "background .14s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div style={{ position: "relative", flex: "none" }}>
                  <Avatar
                    id={r.id}
                    name={fullName}
                    src={r.profile === "none" ? DefaultProfile : r.profile}
                    size={46}
                  />
                  {online && (
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
                  <button
                    onClick={() => navigate(`/${r.username}`)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                      color: "var(--text)",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fullName}
                    </span>
                    {r.isBadged && (
                      <Icon n="verified" s={15} c="var(--brand)" />
                    )}
                  </button>
                  <div
                    style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}
                  >
                    {online
                      ? "Active now"
                      : sessionStatus
                        ? sessionStatus
                        : null}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2, flex: "none" }}>
                  <IconBtn
                    n="forum"
                    title="Message"
                    onClick={() =>
                      navigateToConversation(
                        "single",
                        r.connectionID,
                        r.involvedUserdetails,
                      )
                    }
                    style={{
                      color: "var(--brand)",
                      border: "none",
                      background: "transparent",
                    }}
                  />
                  <IconBtn
                    n="person_remove"
                    title="Remove contact"
                    onClick={() => {
                      if (!isDisabledByRequest)
                        declineRequestProcess(r.connectionID, "remove");
                    }}
                    style={{
                      color: "var(--pink)",
                      border: "none",
                      background: "transparent",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {contacts.next && (
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

export default Contacts;
