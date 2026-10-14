/* eslint-disable @typescript-eslint/no-explicit-any */
import AppShortcuts from "@/app/widgets/desktopwidgets/AppShortcuts";
import AccountMenuContent from "@/app/reusables/AccountMenuContent";
import OverlayScrollArea from "@/app/reusables/OverlayScrollArea";
import { LogoutRequest } from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
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
    <OverlayScrollArea page>
      <div>
        <h1 className="cl-user-page-title">Your account</h1>
        <p className="cl-user-page-subtitle">Your profile, accounts, and Chatterloop apps.</p>
      </div>
      <Card pad={10} style={{ width: '100%', boxSizing: 'border-box' }}>
        <AccountMenuContent onProfileClick={goToProfile} />
      </Card>
      <Card pad={16} style={{ width: '100%', boxSizing: 'border-box' }}>
        <h2 className="cl-account-section-title">Apps</h2>
        <AppShortcuts />
      </Card>
      <button type="button" onClick={handleLogout} className="cl-user-page-logout">Logout</button>
    </OverlayScrollArea>
  );
}

export default UserMenu;
