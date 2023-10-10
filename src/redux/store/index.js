import { createStore, combineReducers } from "redux";
import { setactiveuserslist, setalerts, setapprovedpendingmessageslist, setauthentication, setcallslist, setcontactslist, setconversationsetup, setmediamyvideoholder, setmediatrackholder, setmessageslist, setnotificationslist, setpathnamelistener, setpendingcallalerts, setpendingmessageslist, setrejectedcalllist, setscreensizelistener, settogglerightwidget } from "../actions";

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
    mediamyvideoholder: setmediamyvideoholder
});

const store = createStore(combiner)

export default store;