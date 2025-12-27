import { createStore, combineReducers } from "redux";
import {
  setactiveuserslist,
  setalerts,
  setapprovedpendingmessageslist,
  setauthentication,
  setcallslist,
  setcontactslist,
  setconversationsetup,
  setemojilist,
  setistypinglist,
  setmediamyvideoholder,
  setmediatrackholder,
  setmessageslist,
  setminimizedconversation,
  setnotificationslist,
  setpagemodal,
  setpathnamelistener,
  setpendingcallalerts,
  setpendingmessageslist,
  setpostsfeedlist,
  setrejectedcalllist,
  setscreensizelistener,
  settogglerightwidget,
} from "../actions";

const combiner = combineReducers({
  authentication: setauthentication,
  alerts: setalerts,
  contactslist: setcontactslist,
  notificationslist: setnotificationslist,
  messageslist: setmessageslist,
  conversationsetup: setconversationsetup,
  togglerightwidget: settogglerightwidget,
  screensizelistener: setscreensizelistener,
  pathnamelistener: setpathnamelistener,
  pendingmessageslist: setpendingmessageslist,
  approvedpendingmessageslist: setapprovedpendingmessageslist,
  callslist: setcallslist,
  pendingcallalerts: setpendingcallalerts,
  activeuserslist: setactiveuserslist,
  rejectcalls: setrejectedcalllist,
  mediatrackholder: setmediatrackholder,
  mediamyvideoholder: setmediamyvideoholder,
  postsfeedlist: setpostsfeedlist,
  istypinglist: setistypinglist,
  emojilist: setemojilist,
  minimizedconversation: setminimizedconversation,
  pagemodal: setpagemodal,
});

const store = createStore(combiner);

export default store;
