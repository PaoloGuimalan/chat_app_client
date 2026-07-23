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
import { useNavigate } from "react-router-dom";
import {
  contactsToUserdetails,
  isUserOnline,
  userSessionStatusFromContacts,
} from "../../../reusables/hooks/reusable";
import { PaginationProp } from "@/reusables/vars/props";
import {
  AuthenticationInterface,
  ContactRowData,
  IContact,
} from "@/reusables/vars/interfaces";
import ContactItemLoader from "@/app/reusables/loaders/ContactItemLoader";
import {
  Avatar,
  Badge,
  Card,
  Icon,
  IconBtn,
  useTheme,
} from "@/reusables/design";

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

  // Whoever is currently ACTING - the personal entity normally, or a page
  // while switched. This is the same value /contacts filters on server-side
  // (request.entity, read off the JWT's `entity` claim), so it is the only
  // correct thing to orient each row against: using the human's entity_id
  // would mis-resolve the counterpart on page<->page connections, where
  // neither side is the human.
  const actingEntityID =
    authentication.active_entity_context?.id || authentication.user.entity_id;

  const rows: ContactRowData[] = contactslist.flatMap((cnts) => {
    if (cnts.type !== "single") return [];
    if (!cnts.involved_entity || !cnts.action_by) return [];
    // Orient on the ENTITY id, not the account id. A contact's counterpart can
    // now be a page, whose details.id is a realm pk and would never match a
    // user id - comparing entity ids is the only check valid for both kinds.
    // (EntitySerializer emits `id` = entity id, `details.id` = account/realm pk.)
    const selfActed = cnts.action_by.id === actingEntityID;
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
        entityType: details_ent.type as "user" | "realm",
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
              const isRealm = r.entityType === "realm";
              // Presence is a human concept - a page is never "active now",
              // so skip the online lookup entirely for realm contacts.
              const online =
                !isRealm && isUserOnline(activeuserslist, r.entityID);
              const sessionStatus =
                !isRealm && !online
                  ? userSessionStatusFromContacts(activeuserslist, r.entityID)
                  : null;
              // A realm's whole name arrives in firstName (middleName is the
              // "N/A" sentinel, lastName empty), so this trims to just it.
              const fullName = `${r.firstName}${
                r.middleName === "N/A" ? "" : ` ${r.middleName}`
              } ${r.lastName}`.trim();
              return (
                <div key={i} className="cl-contact-row">
                  <div className="cl-contact-row__avatar">
                    <Avatar
                      id={r.entityID}
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
                      {isRealm && (
                        <span title="Page" style={{ display: "inline-flex" }}>
                          <Icon n="flag" s={14} c="var(--text-3)" />
                        </span>
                      )}
                    </button>
                    <div className="cl-contact-row__status cl-contact-row__status--active">
                      {isRealm
                        ? `@${r.username}`
                        : online
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
                      onClick={() => navigate(`/messages/${r.connectionID}`)}
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

