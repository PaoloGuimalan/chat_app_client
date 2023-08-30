import { createStore, combineReducers } from "redux";
import { setalerts, setauthentication, setcontactslist, setconversationsetup, setmessageslist, setnotificationslist, setpathnamelistener, setscreensizelistener, settogglerightwidget } from "../actions";

const combiner = combineReducers({
    authentication: setauthentication,
    alerts: setalerts,
    contactslist: setcontactslist,
    notificationslist: setnotificationslist,
    messageslist: setmessageslist,
    conversationsetup: setconversationsetup,
    togglerightwidget: settogglerightwidget,
    screensizelistener: setscreensizelistener,
    pathnamelistener: setpathnamelistener
});

const store = createStore(combiner)

export default store;