import { SET_ALERTS, SET_AUTHENTICATION, SET_CONTACTS_LIST, SET_CONVERSATION_SETUP, SET_MESSAGES_LIST, SET_NOTIFICATIONS_LIST, SET_PATHNAME_LISTENER, SET_SCREEN_SIZE_LISTENER, SET_TOGGLE_RIGHT_WIDGET } from "../types";
import { authenticationstate, conversationsetupstate, screensizelistenerstate } from "./states";

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

export const setconversationsetup = (state = conversationsetupstate, action) => {
    switch(action.type){
        case SET_CONVERSATION_SETUP:
            return action.payload.conversationsetup;
        default:
            return state;
    }
}

export const settogglerightwidget = (state = "notifs", action) => {
    switch(action.type){
        case SET_TOGGLE_RIGHT_WIDGET:
            return action.payload.togglerightwidget;
        default:
            return state;
    }
}

export const setscreensizelistener = (state = screensizelistenerstate, action) => {
    switch(action.type){
        case SET_SCREEN_SIZE_LISTENER:
            return action.payload.screensizelistener;
        default:
            return state;
    }
}

export const setpathnamelistener = (state = "/app", action) => {
    switch(action.type){
        case SET_PATHNAME_LISTENER:
            return action.payload.pathnamelistener;
        default:
            return state;
    }
}