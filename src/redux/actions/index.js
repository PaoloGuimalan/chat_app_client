import { SET_ALERTS, SET_AUTHENTICATION } from "../types";
import { authenticationstate } from "./states";

export const setauthentication = (state = authenticationstate, action) => {
    switch(action.type){
        case SET_AUTHENTICATION:
            return action.payload.authentication;
        default:
            return state;
    }
}

export const setalerts = (state = [], action) => {
    switch(action.type){
        case SET_ALERTS:
            return action.payload.alerts;
        default:
            return state;
    }
}