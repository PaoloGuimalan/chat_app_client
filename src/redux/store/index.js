import { createStore, combineReducers } from "redux";
import { setalerts, setapprovedpendingmessageslist, setauthentication, setcallslist, setcontactslist, setconversationsetup, setmessageslist, setnotificationslist, setpathnamelistener, setpendingmessageslist, setscreensizelistener, settogglerightwidget } from "../actions";

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
    callslist: setcallslist
});

const store = createStore(combiner)

export default store;