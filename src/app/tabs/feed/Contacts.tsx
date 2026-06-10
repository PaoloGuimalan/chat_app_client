/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AiOutlineLoading3Quarters,
  AiOutlineMessage,
  AiOutlineSearch,
} from "react-icons/ai";
import { BiUserMinus } from "react-icons/bi";
import { FiArrowRight, FiUsers } from "react-icons/fi";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import DefaultProfile from "../../../assets/imgs/default.png";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  ContactsListInitRequest,
  DeclineContactRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface, IContact } from "@/reusables/vars/interfaces";
import { PaginationProp } from "@/reusables/vars/props";
import {
  contactsToUserdetails,
  isUserOnline,
  userSessionStatusFromContacts,
} from "@/reusables/hooks/reusable";
import {
  conversationsetupstate,
} from "@/redux/actions/states";
import {
  SET_CONVERSATION_SETUP,
  SET_TOGGLE_RIGHT_WIDGET,
} from "@/redux/types";

type ContactFilter = "all" | "online" | "incoming" | "outgoing";

const PAGE_SIZE = 24;

function Contacts() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const contacts: PaginationProp<IContact> = useSelector(
    (state: any) => state.contactslist,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const alerts = useSelector((state: any) => state.alerts);

  const contactslist = contacts.results ?? [];
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<ContactFilter>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisabledByRequest, setIsDisabledByRequest] = useState(false);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setPage(1);
    setIsLoading(true);
    ContactsListInitRequest(
      1,
      PAGE_SIZE,
      true,
      dispatch,
      setIsLoading,
      false,
      debouncedSearchValue === "" ? null : debouncedSearchValue,
    );
  }, [debouncedSearchValue, dispatch]);

  useEffect(() => {
    if (page <= 1) {
      return;
    }

    setIsLoading(true);
    ContactsListInitRequest(
      page,
      PAGE_SIZE,
      false,
      dispatch,
      setIsLoading,
      false,
      debouncedSearchValue === "" ? null : debouncedSearchValue,
    );
  }, [page, debouncedSearchValue, dispatch]);

  useEffect(() => {
    const root = listContainerRef.current;
    const target = loadMoreRef.current;

    if (!root || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading && contacts.next) {
          setPage((currentPage) => currentPage + 1);
        }
      },
      {
        root,
        rootMargin: "160px",
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [contacts.next, isLoading, debouncedSearchValue]);

  const getContactPeer = (contact: IContact) => {
    const isCurrentUserActionBy =
      contact.action_by?.id === authentication.user.userID;

    return {
      peer: isCurrentUserActionBy ? contact.involved_user : contact.action_by,
      isOutgoing: isCurrentUserActionBy,
    };
  };

  const openConversation = (contact: IContact) => {
    const { isOutgoing } = getContactPeer(contact);

    if (screensizelistener.W <= 1100) {
      dispatch({
        type: SET_CONVERSATION_SETUP,
        payload: {
          conversationsetup: {
            conversationid: contact.connection_id,
            userdetails: isOutgoing
              ? contactsToUserdetails(contact, false)
              : contactsToUserdetails(contact, true),
            groupdetails: conversationsetupstate.groupdetails,
            type: "single",
          },
        },
      });
      navigate("/messages");
      return;
    }

    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: {
        conversationsetup: {
          conversationid: contact.connection_id,
          userdetails: isOutgoing
            ? contactsToUserdetails(contact, false)
            : contactsToUserdetails(contact, true),
          groupdetails: conversationsetupstate.groupdetails,
          type: "single",
        },
      },
    });
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload: {
        togglerightwidget: "messages",
      },
    });
  };

  const declineRequestProcess = (connectionID: string, action: string) => {
    setIsDisabledByRequest(true);
    DeclineContactRequest(
      {
        connection_id: connectionID,
        action,
      },
      dispatch,
      alerts,
      setIsDisabledByRequest,
    );
  };

  const normalizedContacts = useMemo(() => {
    return contactslist
      .map((contact) => {
        const { peer, isOutgoing } = getContactPeer(contact);
        const isOnline = isUserOnline(activeuserslist, peer.id);
        const sessionStatus = userSessionStatusFromContacts(
          activeuserslist,
          peer.id,
        );

        return {
          contact,
          peer,
          isOutgoing,
          isOnline,
          sessionStatus,
          displayName: `${peer.first_name}${
            peer.middle_name === "N/A" ? "" : ` ${peer.middle_name}`
          } ${peer.last_name}`.trim(),
        };
      })
      .filter((entry) => {
        if (selectedFilter === "online") {
          return entry.isOnline;
        }

        if (selectedFilter === "incoming") {
          return !entry.isOutgoing;
        }

        if (selectedFilter === "outgoing") {
          return entry.isOutgoing;
        }

        return true;
      })
      .sort((left, right) => {
        return new Date(right.contact.action_date).getTime() -
          new Date(left.contact.action_date).getTime();
      });
  }, [activeuserslist, contactslist, selectedFilter, authentication.user.userID]);

  const activeCount = useMemo(() => {
    return normalizedContacts.filter((entry) => entry.isOnline).length;
  }, [normalizedContacts]);

  const incomingCount = useMemo(() => {
    return contactslist.filter((contact) => {
      const { isOutgoing } = getContactPeer(contact);
      return !isOutgoing;
    }).length;
  }, [contactslist, authentication.user.userID]);

  const outgoingCount = useMemo(() => {
    return contactslist.filter((contact) => {
      const { isOutgoing } = getContactPeer(contact);
      return isOutgoing;
    }).length;
  }, [contactslist, authentication.user.userID]);

  return (
    <div className="cl-screen-shell">
      <div className="cl-contacts-shell">
        <section className="cl-card cl-card-pad cl-contacts-main">
          <div className="cl-contacts-hero">
            <div>
              <div className="cl-section-title" style={{ marginBottom: 8 }}>
                <div>
                  <h3>Contacts</h3>
                  <div className="cl-contacts-subtitle">
                    Manage your connections, jump into chats, and review who is online.
                  </div>
                </div>
              </div>
            </div>

            <div className="cl-contacts-chips">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "online", label: "Online" },
                  { key: "incoming", label: "Incoming" },
                  { key: "outgoing", label: "Outgoing" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="cl-pill"
                  data-active={selectedFilter === chip.key}
                  onClick={() => setSelectedFilter(chip.key)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="cl-grid-3 cl-contacts-stats">
            <div className="cl-card cl-card-pad cl-contacts-stat">
              <span className="cl-contacts-stat-value">{contacts.count}</span>
              <span className="cl-contacts-stat-label">Connections</span>
            </div>
            <div className="cl-card cl-card-pad cl-contacts-stat">
              <span className="cl-contacts-stat-value">{activeCount}</span>
              <span className="cl-contacts-stat-label">Online now</span>
            </div>
            <div className="cl-card cl-card-pad cl-contacts-stat">
              <span className="cl-contacts-stat-value">
                {incomingCount}/{outgoingCount}
              </span>
              <span className="cl-contacts-stat-label">Incoming / outgoing</span>
            </div>
          </div>

          <div className="cl-input-shell cl-contacts-search">
            <AiOutlineSearch size={18} color="var(--cl-text-3)" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search contacts"
              autoComplete="off"
            />
          </div>

          <div className="cl-contacts-list" ref={listContainerRef}>
            {isLoading ? (
              <div className="cl-contacts-loading-state">
                <AiOutlineLoading3Quarters className="cl-spin" size={20} />
                <span>Loading contacts</span>
              </div>
            ) : normalizedContacts.length > 0 ? (
              normalizedContacts.map(({ contact, peer, isOutgoing, isOnline, sessionStatus, displayName }) => (
                <motion.article
                  key={contact.connection_id}
                  className="cl-card cl-contacts-item"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <button
                    type="button"
                    className="cl-contacts-avatar"
                    onClick={() => navigate(`/${peer.username}`)}
                    aria-label={`Open ${displayName} profile`}
                  >
                    <CachedImage
                      src={peer.profile === "none" ? DefaultProfile : peer.profile}
                      id={peer.profile === "none" ? "img_default_profile" : "img_actual_profile"}
                    />
                    {isOnline && <span className="cl-contacts-online-dot" />}
                  </button>

                  <div className="cl-contacts-body">
                    <div className="cl-contacts-name-row">
                      <button
                        type="button"
                        className="cl-contacts-name"
                        onClick={() => navigate(`/${peer.username}`)}
                      >
                        <span>{displayName}</span>
                        {peer.is_badged && (
                          <RiVerifiedBadgeFill size={16} color="var(--cl-brand)" />
                        )}
                      </button>
                      <span className="cl-pill" data-active={isOnline}>
                        {isOnline ? "Active now" : sessionStatus || "Offline"}
                      </span>
                    </div>

                    <div className="cl-contacts-meta">
                      <span>@{peer.username}</span>
                      {contact.nickname && <span>Alias: {contact.nickname}</span>}
                      <span>{isOutgoing ? "You added them" : "They added you"}</span>
                    </div>
                  </div>

                  <div className="cl-contacts-actions">
                    <button
                      type="button"
                      className="cl-contacts-action-btn"
                      onClick={() => openConversation(contact)}
                      title="Open conversation"
                    >
                      <AiOutlineMessage size={18} />
                    </button>
                    <button
                      type="button"
                      className="cl-contacts-action-btn cl-contacts-action-destructive"
                      onClick={() => declineRequestProcess(contact.connection_id, "remove")}
                      disabled={isDisabledByRequest}
                      title="Remove contact"
                    >
                      <BiUserMinus size={18} />
                    </button>
                    <button
                      type="button"
                      className="cl-contacts-action-btn"
                      onClick={() => navigate(`/${peer.username}`)}
                      title="Open profile"
                    >
                      <FiArrowRight size={18} />
                    </button>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="cl-card cl-card-pad cl-contacts-empty">
                <FiUsers size={18} />
                <div>
                  <div className="cl-contacts-empty-title">No contacts found</div>
                  <div className="cl-contacts-empty-copy">
                    Try a different search term or switch the filter chip.
                  </div>
                </div>
              </div>
            )}

            {contacts.next && (
              <div ref={loadMoreRef} className="cl-contacts-sentinel">
                <AiOutlineLoading3Quarters className="cl-spin" size={18} />
                <span>Loading more</span>
              </div>
            )}
          </div>
        </section>

        <aside className="cl-feed-sidebar cl-contacts-sidebar">
          <div className="cl-card cl-card-pad">
            <div className="cl-section-title">
              <h3>Quick actions</h3>
            </div>
            <div className="cl-contacts-quick-actions">
              <button
                type="button"
                className="cl-pill"
                data-active={false}
                onClick={() => navigate("/messages")}
              >
                Open messages
              </button>
              <button
                type="button"
                className="cl-pill"
                data-active={false}
                onClick={() => navigate("/search")}
              >
                Explore people
              </button>
              <button
                type="button"
                className="cl-pill"
                data-active={false}
                onClick={() => navigate("/settings")}
              >
                Contact settings
              </button>
            </div>
          </div>

          <div className="cl-card cl-card-pad">
            <div className="cl-section-title">
              <h3>Overview</h3>
            </div>
            <div className="cl-contacts-overview">
              <div>
                <span className="cl-contacts-overview-value">{contacts.count}</span>
                <span className="cl-contacts-overview-label">Total contacts</span>
              </div>
              <div>
                <span className="cl-contacts-overview-value">{activeCount}</span>
                <span className="cl-contacts-overview-label">Online now</span>
              </div>
              <div>
                <span className="cl-contacts-overview-value">{normalizedContacts.length}</span>
                <span className="cl-contacts-overview-label">Visible results</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Contacts;
