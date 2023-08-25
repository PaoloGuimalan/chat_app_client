import { createStore, combineReducers } from "redux";
import { setalerts, setauthentication, setcontactslist, setmessageslist, setnotificationslist } from "../actions";

const combiner = combineReducers({
    authentication: setauthentication,
    alerts: setalerts,
    contactslist: setcontactslist,
    notificationslist: setnotificationslist,
    messageslist: setmessageslist
});

const store = createStore(combiner)

export default store;