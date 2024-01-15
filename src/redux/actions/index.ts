import { CHECK_AND_ADD_NEW_CALL_LIST_WINDOW, CLEAR_PENDING_CALL_ALERTS, END_CALL_LIST, MEDIA_MY_VIDEO_HOLDER, MEDIA_TRACK_HOLDER, REMOVE_PENDING_CALL_ALERTS, REMOVE_REJECTED_CALL_LIST, SET_ACTIVE_USERS_LIST, SET_ALERTS, SET_APPROVED_PENDING_MESSAGES_LIST, SET_AUTHENTICATION, SET_CALLS_LIST, SET_CLEAR_ALERTS, SET_CONTACTS_LIST, SET_CONVERSATION_SETUP, SET_FILTERED_ALERTS, SET_MESSAGES_LIST, SET_MUTATE_ALERTS, SET_MUTATE_POSTS_FEED_LIST, SET_NOTIFICATIONS_LIST, SET_PATHNAME_LISTENER, SET_PENDING_CALL_ALERTS, SET_PENDING_MESSAGES_LIST, SET_POSTS_FEED_LIST, SET_REJECTED_CALL_LIST, SET_SCREEN_SIZE_LISTENER, SET_TOGGLE_RIGHT_WIDGET, UPDATE_ACTIVE_USERS_LIST } from "../types";
import { authenticationstate, conversationsetupstate, screensizelistenerstate } from "./states";

export const setauthentication = (state = authenticationstate, action: any) => {
    switch(action.type){
        case SET_AUTHENTICATION:
            return action.payload.authentication;
        default:
            return state;
    }
}

export const setalerts = (state = [], action: any) => {
    switch(action.type){
        case SET_ALERTS:
            return [
                ...state,
                action.payload.alerts
            ];
        case SET_MUTATE_ALERTS:
            return [
                ...state,
                {
                    id: state.length,
                    ...action.payload.alerts
                }
            ]
        case SET_FILTERED_ALERTS:
            var filterstate = state.filter((flt: any) => flt.id != action.payload.alertID);
            return filterstate;
        case SET_CLEAR_ALERTS:
            return action.payload.alerts
        default:
            return state;
    }
}

export const setcontactslist = (state = [], action: any) => {
    switch(action.type){
        case SET_CONTACTS_LIST:
            return action.payload.contactslist;
        default:
            return state;
    }
}

export const setnotificationslist = (state = [], action: any) => {
    switch(action.type){
        case SET_NOTIFICATIONS_LIST:
            return action.payload.notficationslist;
        default:
            return state;
    }
}

export const setmessageslist = (state = [], action: any) => {
    switch(action.type){
        case SET_MESSAGES_LIST:
            return action.payload.messageslist;
        default:
            return state;
    }
}

export const setconversationsetup = (state = conversationsetupstate, action: any) => {
    switch(action.type){
        case SET_CONVERSATION_SETUP:
            return action.payload.conversationsetup;
        default:
            return state;
    }
}

export const settogglerightwidget = (state = "notifs", action: any) => {
    switch(action.type){
        case SET_TOGGLE_RIGHT_WIDGET:
            return action.payload.togglerightwidget;
        default:
            return state;
    }
}

export const setscreensizelistener = (state = screensizelistenerstate, action: any) => {
    switch(action.type){
        case SET_SCREEN_SIZE_LISTENER:
            return action.payload.screensizelistener;
        default:
            return state;
    }
}

export const setpathnamelistener = (state = "/", action: any) => {
    switch(action.type){
        case SET_PATHNAME_LISTENER:
            return action.payload.pathnamelistener;
        default:
            return state;
    }
}

export const setpendingmessageslist = (state = [], action: any) => {
    switch(action.type){
        case SET_PENDING_MESSAGES_LIST:
            return action.payload.pendingmessageslist;
        default:
            return state;
    }
}

export const setapprovedpendingmessageslist = (state = [], action: any) => {
    switch(action.type){
        case SET_APPROVED_PENDING_MESSAGES_LIST:
            return action.payload.approvedpendingmessageslist;
        default:
            return state;
    }
}

export const setcallslist = (state = [], action: any) => {
    switch(action.type){
        case SET_CALLS_LIST:
            return action.payload.callslist;
        case CHECK_AND_ADD_NEW_CALL_LIST_WINDOW:
            const newconversationID = action.payload.callmetadata.conversationID;
            const ifWindowExists = state.map((mp: any) => mp.conversationID).includes(newconversationID);
            if(!ifWindowExists){
                return [
                    ...state,
                    action.payload.callmetadata
                ]
            }
            else{
                return state;
            }
        case END_CALL_LIST:
            const newCallsList = state.filter((onc: any) => onc.conversationID != action.payload.callID);
            return newCallsList;
        default:
            return state;
    }
}

export const setpendingcallalerts = (state = [], action: any) => {
    switch(action.type){
        case SET_PENDING_CALL_ALERTS:
            var newState = [
                ...state,
                action.payload.pendingcallalerts
            ]
            return newState;
        case REMOVE_PENDING_CALL_ALERTS:
            var newFilterState = state.filter((flt: any) => flt.callID != action.payload.callID)
            return newFilterState;
        case CLEAR_PENDING_CALL_ALERTS:
            return action.payload.clearstate;
        default:
            return state;
    }
}

export const setactiveuserslist = (state = [], action: any) => {
    switch(action.type){
        case SET_ACTIVE_USERS_LIST:
            return action.payload.activeuserslist;
        case UPDATE_ACTIVE_USERS_LIST:
            var updatedUser = action.payload.updatedUser;
            var newState = state.filter((mp: any) => mp._id != updatedUser._id);
            return [
                ...newState,
                updatedUser
            ];
        default:
            return state;
    }
}

export const setrejectedcalllist = (state = [], action: any) => {
    switch(action.type){
        case SET_REJECTED_CALL_LIST:
            var conversationID = action.payload.callID;
            return [
                ...state,
                conversationID
            ];
        case REMOVE_REJECTED_CALL_LIST:
            var conversationID = action.payload.callID;
            var filterRejects = state.filter((flt) => flt != conversationID);
            return filterRejects;
        default:
            return state;
    }
}

export const setmediatrackholder = (state = [], action: any) => {
    switch(action.type){
        case MEDIA_TRACK_HOLDER:
            return action.payload.mediatrackholder;
        default:
            return state;
    }
}

export const setmediamyvideoholder = (state = null, action: any) => {
    switch(action.type){
        case MEDIA_MY_VIDEO_HOLDER:
            return action.payload.mediamyvideoholder;
        default:
            return state;
    }
}

export const setpostsfeedlist = (state: any[] = [], action: any) => {
    switch(action.type){
        case SET_POSTS_FEED_LIST:
            return action.payload.postsfeedlist;
        case SET_MUTATE_POSTS_FEED_LIST:
            return [
                ...state,
                action.payload.newpostfeedlist
            ];
        default:
            return state;
    }
}