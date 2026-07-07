/* eslint-disable @typescript-eslint/no-explicit-any */
import AppMenu from "@/app/widgets/desktopwidgets/AppMenu";
import EntitySwitcher from "@/app/reusables/EntitySwitcher";
import { LogoutRequest } from "@/reusables/hooks/requests";
import { getActiveAvatar } from "@/reusables/hooks/reusable";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { BsPersonFill } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card } from "@/reusables/design";
import { CloseSSENotifications } from "@/reusables/hooks/sse";
import {
  CLEAR_PENDING_CALL_ALERTS,
  SET_CALLS_LIST,
  SET_CLEAR_ALERTS,
  SET_CONTACTS_LIST_OVERRIDE,
  SET_CONVERSATION_SETUP,
  SET_MESSAGES_LIST_OVERRIDE,
  SET_MINIMIZED_CONVERSATION_OVERRIDE,
  SET_NOTIFICATIONS_LIST_OVERRIDE,
} from "@/redux/types";
import {
  contactsliststate,
  conversationsetupstate,
} from "@/redux/actions/states";

function UserMenu() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activeEntityContext = authentication.active_entity_context;
  const isActingAsPage = Boolean(activeEntityContext?.is_switched);
  const activeAvatar = getActiveAvatar(authentication);

  const goToProfile = () => {
    if (isActingAsPage) {
      // Same swap as the desktop rail: while acting as a page, "Profile"
      // means the page's own public profile, not the personal one.
      navigate(`/${activeEntityContext.slug || activeEntityContext.realm_id}`);
      return;
    }
    navigate(`/${authentication.user.username}`);
  };

  const clearStates = () => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: { conversationsetup: conversationsetupstate },
    });
    dispatch({
      type: SET_MESSAGES_LIST_OVERRIDE,
      payload: { messageslist: [] },
    });
    dispatch({ type: SET_CLEAR_ALERTS, payload: { alerts: [] } });
    dispatch({ type: SET_CALLS_LIST, payload: { callslist: [] } });
    dispatch({
      type: CLEAR_PENDING_CALL_ALERTS,
      payload: { clearstate: [] },
    });
    dispatch({
      type: SET_CONTACTS_LIST_OVERRIDE,
      payload: { contactslist: contactsliststate },
    });
    dispatch({
      type: SET_MINIMIZED_CONVERSATION_OVERRIDE,
      payload: { conversations: [] },
    });
    dispatch({
      type: SET_NOTIFICATIONS_LIST_OVERRIDE,
      payload: { notficationslist: { list: [], totalunread: 0 } },
    });
  };

  const handleLogout = () => {
    clearStates();
    CloseSSENotifications();
    LogoutRequest(dispatch);
    navigate("/login");
  };

  return (
    <div className="tw-w-full tw-max-w-[600px] tw-bg-transparent tw-flex-1 tw-flex tw-flex-col tw-items-center tw-p-[10px] tw-pt-[8px] tw-overflow-y-auto scroller tw-gap-[10px]">
      <Card pad={14} style={{ width: "100%" }}>
        <div
          id="div_app_menu_label_container"
          className="tw-items-center tw-pt-[0px]"
        >
          <BsPersonFill style={{ fontSize: "22px", color: "#1c7DEF" }} />
          <span className="span_contacts_label tw-text-[var(--text-2)]">
            Profile
          </span>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center">
          <div className="tw-w-full tw-min-h-[72px] tw-flex tw-flex-row tw-items-center tw-gap-[12px] tw-py-[10px] tw-px-[4px]">
            <EntitySwitcher
              onProfileClick={goToProfile}
              profileSrc={activeAvatar.src}
              profileName={activeAvatar.name}
              size={44}
            />
            <button
              onClick={goToProfile}
              className="tw-select-none tw-cursor-pointer tw-bg-transparent tw-border-none tw-text-left tw-p-0 tw-flex tw-flex-col tw-items-start tw-min-w-0 tw-flex-1"
            >
              {isActingAsPage ? (
                <>
                  <span
                    id="span_user_firstname_label"
                    className="tw-w-full tw-text-[var(--text-2)]"
                    style={{ marginBottom: 2 }}
                  >
                    {activeEntityContext.name}
                  </span>
                  <span className="tw-text-[13px] tw-text-[var(--text-2)] tw-break-all tw-w-full">
                    @{activeEntityContext.slug || activeEntityContext.realm_id}
                  </span>
                </>
              ) : (
                <>
                  <span
                    id="span_user_firstname_label"
                    className="tw-w-full tw-text-[var(--text-2)]"
                    style={{ marginBottom: 2 }}
                  >
                    {authentication.user.fullName.firstName}
                    {authentication.user.fullName.middleName == "N/A"
                      ? ""
                      : ` ${authentication.user.fullName.middleName}`}{" "}
                    {authentication.user.fullName.lastName}
                  </span>
                  <span className="tw-text-[13px] tw-text-[var(--text-2)] tw-break-all tw-w-full">
                    @{authentication.user.username}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-justify-end tw-pt-[8px]">
          <button
            onClick={handleLogout}
            className="cl-profile-action-button--danger tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[12px] tw-pr-[12px] tw-rounded-[12px] tw-text-[12px]"
          >
            Logout
          </button>
        </div>
      </Card>
      <AppMenu />
    </div>
  );
}

export default UserMenu;

