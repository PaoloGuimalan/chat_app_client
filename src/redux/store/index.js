import { createStore, combineReducers } from "redux";
import { setauthentication } from "../actions";

const combiner = combineReducers({
    authentication: setauthentication
});

const store = createStore(combiner)

export default store;