/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import {
  ContactsListInitRequest,
  // DeclineContactRequest,
} from "../../../reusables/hooks/requests";
import {
  SET_CONVERSATION_SETUP,
  SET_MINIMIZED_CONVERSATION,
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
import {
  Avatar,
  Badge,
  Card,
  Icon,
  IconBtn,
  useTheme,
} from "@/reusables/design";

interface ContactRowData {
  id: string;
  entityID: string;
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
  // const alerts = useSelector((state: any) => state.alerts);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const [isLoading, setisLoading] = useState(true);
  // const [_isDisabledByRequest, setisDisabledByRequest] = useState(false);

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

  // const declineRequestProcess = (connection_id: any, action: string) => {
  //   setisDisabledByRequest(true);
  //   DeclineContactRequest(
  //     { connection_id, action },
  //     dispatch,
  //     alerts,
  //     setisDisabledByRequest,
  //   );
  // };

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
    if (isMobile) {
      navigate("/messages");
      return;
    }
    if (type === "single") {
      dispatch({
        type: SET_MINIMIZED_CONVERSATION,
        payload: {
          conversation: {
            conversationid: conversationID,
            userdetails,
            groupdetails: conversationsetupstate.groupdetails,
            type: "single",
          },
        },
      });
      return;
    }
    settogglerightwidget("messages");
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

  const rows: ContactRowData[] = contactslist.flatMap((cnts) => {
    if (cnts.type !== "single") return [];
    if (!cnts.involved_entity || !cnts.action_by) return [];
    const selfActed = cnts.action_by.details.id === authentication.user.userID;
    const u = selfActed ? cnts.involved_entity.details : cnts.action_by.details;
    const details_ent = selfActed ? cnts.involved_entity : cnts.action_by;
    return [
      {
        id: u.id,
        entityID: details_ent.id,
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
      className="cl-redesign cl-contacts-page"
      data-theme={theme}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
        maxWidth: isStandalone ? 760 : "100%",
        margin: isStandalone ? "0 auto" : undefined,
        padding: isStandalone ? "18px 22px" : "16px 12px",
        gap: 16,
        background: "transparent",
      }}
    >
      <div className="cl-contacts-page__header">
        <span className="cl-contacts-page__icon-shell">
          <Icon n="contacts" s={18} c="var(--green)" />
        </span>
        <div className="cl-contacts-page__title-block">
          <h2 className="cl-contacts-page__title">Contacts</h2>
          <span className="cl-contacts-page__subtitle">
            Manage your connections and jump into conversations.
          </span>
        </div>
        <Badge tone="green">{rows.length}</Badge>
      </div>

      <Card
        pad={0}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
        }}
      >
        <div className="cl-contacts-page__toolbar">
          <div className="cl-contacts-page__toolbar-copy">
            <span className="cl-contacts-page__toolbar-title">
              All contacts
            </span>
            <span className="cl-contacts-page__toolbar-subtitle">
              {rows.length} people available
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="cl-contacts-page__list">
            {Array.from({ length: 12 }, (_, i) => (
              <ContactItemLoader key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="cl-contacts-page__empty">
            <Icon n="contacts" s={42} />
            <span>No contacts</span>
          </div>
        ) : (
          <div ref={divcontentRef} className="cl-contacts-page__list">
            {rows.map((r, i) => {
              const online = isUserOnline(activeuserslist, r.entityID);
              const sessionStatus = !online
                ? userSessionStatusFromContacts(activeuserslist, r.entityID)
                : null;
              const fullName = `${r.firstName}${
                r.middleName === "N/A" ? "" : ` ${r.middleName}`
              } ${r.lastName}`;
              return (
                <div key={i} className="cl-contact-row">
                  <div className="cl-contact-row__avatar">
                    <Avatar
                      id={r.id}
                      name={fullName}
                      src={r.profile === "none" ? undefined : r.profile}
                      size={46}
                    />
                    {online && <span className="cl-contact-row__online-dot" />}
                  </div>
                  <div className="cl-contact-row__content">
                    <button
                      onClick={() => navigate(`/${r.username}`)}
                      className="cl-contact-row__name"
                    >
                      <span className="cl-contact-row__name-text">
                        {fullName}
                      </span>
                      {r.isBadged && (
                        <Icon n="verified" s={15} c="var(--brand)" />
                      )}
                    </button>
                    <div className="cl-contact-row__status cl-contact-row__status--active">
                      {online
                        ? "Active now"
                        : sessionStatus
                          ? sessionStatus
                          : null}
                    </div>
                  </div>
                  <div className="cl-contact-row__actions">
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
                        background: "var(--surface-2)",
                      }}
                    />
                    {/* <IconBtn
                      n="person_remove"
                      title="Remove contact"
                      onClick={() => {
                        if (!isDisabledByRequest)
                          declineRequestProcess(r.connectionID, "remove");
                      }}
                      style={{
                        color: "var(--pink)",
                        background: "var(--surface-2)",
                      }}
                    /> */}
                  </div>
                </div>
              );
            })}
            {contacts.next && (
              <div ref={divlazyloaderRef} className="cl-contacts-page__loader">
                <AiOutlineLoading3Quarters
                  className="cl-spin"
                  style={{ fontSize: 22 }}
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Contacts;

