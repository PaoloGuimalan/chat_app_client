import { createStore, combineReducers } from "redux";
import { setactiveuserslist, setalerts, setapprovedpendingmessageslist, setauthentication, setcallslist, setcontactslist, setconversationsetup, setmessageslist, setnotificationslist, setpathnamelistener, setpendingcallalerts, setpendingmessageslist, setscreensizelistener, settogglerightwidget } from "../actions";

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
    activeuserslist: setactiveuserslist
});

const store = createStore(combiner)

export default store;