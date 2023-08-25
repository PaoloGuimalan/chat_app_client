import { SET_ALERTS, SET_AUTHENTICATION, SET_CONTACTS_LIST, SET_MESSAGES_LIST, SET_NOTIFICATIONS_LIST } from "../types";
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

export const setcontactslist = (state = [], action) => {
    switch(action.type){
        case SET_CONTACTS_LIST:
            return action.payload.contactslist;
        default:
            return state;
    }
}

export const setnotificationslist = (state = [], action) => {
    switch(action.type){
        case SET_NOTIFICATIONS_LIST:
            return action.payload.notficationslist;
        default:
            return state;
    }
}

export const setmessageslist = (state = [], action) => {
    switch(action.type){
        case SET_MESSAGES_LIST:
            return action.payload.messageslist;
        default:
            return state;
    }
}