import { createStore, combineReducers } from "redux";
import { setalerts, setauthentication } from "../actions";

const combiner = combineReducers({
    authentication: setauthentication,
    alerts: setalerts
});

const store = createStore(combiner)

export default store;