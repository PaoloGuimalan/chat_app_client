/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import AppMenu from "@/app/widgets/desktopwidgets/AppMenu";
import { LogoutRequest } from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { BsPersonFill } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, Btn, Card } from "@/reusables/design";
import IdentitySwitcher from "@/app/widgets/IdentitySwitcher";
import type { ActiveEntityState } from "@/redux/actions/states";
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
  const activeentity: ActiveEntityState = useSelector(
    (state: any) => state.activeentity,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const actingAsRealm = activeentity?.entityType === "realm";

  // The Profile row reflects the *active* identity, so viewing the profile
  // views as that identity (the page when acting as a page, else the user).
  const activeIdentity = actingAsRealm
    ? {
        avatarId: activeentity?.display?.realm_id ?? "realm",
        name: activeentity?.display?.name ?? "Page",
        sub: activeentity?.display?.realmType ?? "page",
        profile:
          activeentity?.display?.profile &&
          activeentity?.display?.profile !== "none"
            ? activeentity?.display?.profile
            : undefined,
        // Only the realm profile uses the slug; fall back to realm_id.
        target: `/${
          activeentity?.display?.slug || activeentity?.display?.realm_id
        }`,
      }
    : {
        avatarId: authentication.user.username,
        name: `${authentication.user.fullName.firstName}${
          authentication.user.fullName.middleName === "N/A"
            ? ""
            : ` ${authentication.user.fullName.middleName}`
        } ${authentication.user.fullName.lastName}`,
        sub: `@${authentication.user.username}`,
        profile:
          authentication.user.profile !== "none"
            ? authentication.user.profile
            : undefined,
        target: `/${authentication.user.username}`,
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
            {actingAsRealm ? "Acting as" : "Profile"}
          </span>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center">
          <button
            onClick={() => {
              navigate(activeIdentity.target);
            }}
            className="tw-select-none tw-cursor-pointer tw-w-full tw-bg-transparent tw-border-none tw-text-left tw-p-0"
          >
            <div className="tw-w-full tw-min-h-[72px] tw-flex tw-flex-row tw-items-center tw-gap-[12px] tw-py-[10px] tw-px-[4px]">
              <Avatar
                id={activeIdentity.avatarId}
                name={activeIdentity.name}
                src={activeIdentity.profile}
                size={44}
                ring={actingAsRealm}
              />
              <div className="tw-flex tw-flex-col tw-items-start tw-min-w-0 tw-flex-1">
                <span
                  id="span_user_firstname_label"
                  className="tw-w-full tw-text-[var(--text-2)]"
                  style={{ marginBottom: 2 }}
                >
                  {activeIdentity.name}
                </span>
                <span className="tw-text-[13px] tw-text-[var(--text-2)] tw-break-all tw-w-full tw-capitalize">
                  {activeIdentity.sub}
                </span>
              </div>
            </div>
          </button>
        </div>
        <div className="tw-w-full tw-flex tw-items-center tw-justify-between tw-pt-[8px]">
          <Btn
            variant="soft"
            size="sm"
            iconL="switch_account"
            onClick={() => setShowSwitcher(true)}
          >
            Switch identity
          </Btn>
          <button
            onClick={handleLogout}
            className="cl-profile-action-button--danger tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[12px] tw-pr-[12px] tw-rounded-[12px] tw-text-[12px]"
          >
            Logout
          </button>
        </div>
      </Card>
      <AppMenu />
      {showSwitcher && (
        <IdentitySwitcher onClose={() => setShowSwitcher(false)} />
      )}
    </div>
  );
}

export default UserMenu;

