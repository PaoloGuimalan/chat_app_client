/* eslint-disable no-var */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaginationProp } from "@/reusables/vars/props";
import {
  CHECK_AND_ADD_NEW_CALL_LIST_WINDOW,
  CLEAR_PENDING_CALL_ALERTS,
  CLOSE_MINIMIZED_CONVERSATION,
  END_CALL_LIST,
  MEDIA_MY_VIDEO_HOLDER,
  MEDIA_TRACK_HOLDER,
  REMOVE_PENDING_CALL_ALERTS,
  REMOVE_PREVIEW_PARTICIPANT,
  REMOVE_REJECTED_CALL_LIST,
  SET_ACTIVE_USERS_LIST,
  SET_ALERTS,
  SET_APPROVED_PENDING_MESSAGES_LIST,
  SET_AUTHENTICATION,
  SET_CALLS_LIST,
  SET_CLEAR_ALERTS,
  SET_CONTACTS_LIST,
  SET_CONTACTS_LIST_OVERRIDE,
  SET_CONVERSATION_SETUP,
  SET_COORDINATES,
  SET_EMOJIS_LIST,
  SET_FILTERED_ALERTS,
  SET_IS_TYPING_LIST,
  SET_MESSAGES_LIST,
  SET_MESSAGES_LIST_OVERRIDE,
  SET_MINIMIZED_CONVERSATION,
  SET_MINIMIZED_CONVERSATION_OVERRIDE,
  SET_MUTATE_ALERTS,
  SET_MUTATE_POSTS_FEED_LIST,
  SET_NOTIFICATIONS_LIST,
  SET_NOTIFICATIONS_LIST_OVERRIDE,
  SET_PAGE_MODAL,
  SET_PATHNAME_LISTENER,
  SET_PENDING_CALL_ALERTS,
  SET_PENDING_MESSAGES_LIST,
  SET_POSTS_FEED_LIST,
  SET_PREVIEW_PARTICIPANTS,
  SET_PREVIEW_PARTICIPANTS_BULK,
  SET_RAW_COORDINATES,
  SET_REJECTED_CALL_LIST,
  SET_REMOVE_IS_TYPING_LIST,
  SET_SCREEN_SIZE_LISTENER,
  SET_TOGGLE_RIGHT_WIDGET,
  SET_USER_SETTINGS,
  UPDATE_ACTIVE_USERS_LIST,
} from "../types";
import {
  authenticationstate,
  contactsliststate,
  conversationsetupstate,
  screensizelistenerstate,
  usersettingsstate,
} from "./states";
import {
  Emoji,
  IContact,
  ICoordinatesAnchor,
  IPageModal,
  IPreviewParicipants,
  IUserSettings,
} from "@/reusables/vars/interfaces";

export const setauthentication = (state = authenticationstate, action: any) => {
  switch (action.type) {
    case SET_AUTHENTICATION:
      return action.payload.authentication;
    default:
      return state;
  }
};

export const setalerts = (state = [], action: any) => {
  switch (action.type) {
    case SET_ALERTS:
      return [...state, action.payload.alerts];
    case SET_MUTATE_ALERTS:
      return [
        ...state,
        {
          id: state.length,
          ...action.payload.alerts,
        },
      ];
    case SET_FILTERED_ALERTS:
      var filterstate = state.filter(
        (flt: any) => flt.id != action.payload.alertID,
      );
      return filterstate;
    case SET_CLEAR_ALERTS:
      return action.payload.alerts;
    default:
      return state;
  }
};

export const setcontactslist = (
  state: PaginationProp<IContact> = contactsliststate,
  action: any,
) => {
  switch (action.type) {
    case SET_CONTACTS_LIST:
      const combinedList = [
        ...state.results,
        ...action.payload.contactslist.results,
      ];
      const uniqueById = combinedList.filter(
        (obj, index, self) =>
          index ===
          self.findIndex((t) => t.connection_id === obj.connection_id),
      );
      return { ...action.payload.contactslist, results: uniqueById };
    //   return action.payload.contactslist;
    case SET_CONTACTS_LIST_OVERRIDE:
      return action.payload.contactslist;
    default:
      return state;
  }
};

export const setnotificationslist = (
  state = { list: [], totalunread: 0, total: 0, next: true },
  action: any,
) => {
  switch (action.type) {
    case SET_NOTIFICATIONS_LIST:
      const incominglist = action.payload.notficationslist.list;
      const combinedList = [...state.list, ...incominglist];
      const uniqueById = combinedList.filter(
        (obj, index, self) =>
          index ===
          self.findIndex((t) => t.notificationID === obj.notificationID),
      );
      return { ...action.payload.notficationslist, list: uniqueById };
    case SET_NOTIFICATIONS_LIST_OVERRIDE:
      return action.payload.notficationslist;
    default:
      return state;
  }
};

export const setmessageslist = (state = [], action: any) => {
  switch (action.type) {
    case SET_MESSAGES_LIST:
      const combinedList = [...state, ...action.payload.messageslist];
      const uniqueById = combinedList.filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t._id === obj._id),
      );
      return uniqueById;
    case SET_MESSAGES_LIST_OVERRIDE:
      return action.payload.messageslist;
    default:
      return state;
  }
};

export const setconversationsetup = (
  state = conversationsetupstate,
  action: any,
) => {
  switch (action.type) {
    case SET_CONVERSATION_SETUP:
      return action.payload.conversationsetup;
    default:
      return state;
  }
};

export const settogglerightwidget = (state = "messages", action: any) => {
  //notifs
  switch (action.type) {
    case SET_TOGGLE_RIGHT_WIDGET:
      return action.payload.togglerightwidget;
    default:
      return state;
  }
};

export const setscreensizelistener = (
  state = screensizelistenerstate,
  action: any,
) => {
  switch (action.type) {
    case SET_SCREEN_SIZE_LISTENER:
      return action.payload.screensizelistener;
    default:
      return state;
  }
};

export const setpathnamelistener = (state = "/", action: any) => {
  switch (action.type) {
    case SET_PATHNAME_LISTENER:
      return action.payload.pathnamelistener;
    default:
      return state;
  }
};

export const setpendingmessageslist = (state = [], action: any) => {
  switch (action.type) {
    case SET_PENDING_MESSAGES_LIST:
      return action.payload.pendingmessageslist.reverse();
    default:
      return state.reverse();
  }
};

export const setapprovedpendingmessageslist = (state = [], action: any) => {
  switch (action.type) {
    case SET_APPROVED_PENDING_MESSAGES_LIST:
      return action.payload.approvedpendingmessageslist;
    default:
      return state;
  }
};

export const setcallslist = (state = [], action: any) => {
  switch (action.type) {
    case SET_CALLS_LIST:
      return action.payload.callslist;
    case CHECK_AND_ADD_NEW_CALL_LIST_WINDOW:
      const newconversationID = action.payload.callmetadata.conversationID;
      const ifWindowExists = state
        .map((mp: any) => mp.conversationID)
        .includes(newconversationID);
      if (!ifWindowExists) {
        return [...state, action.payload.callmetadata];
      } else {
        return state;
      }
    case END_CALL_LIST:
      const newCallsList = state.filter(
        (onc: any) => onc.conversationID != action.payload.callID,
      );
      return newCallsList;
    default:
      return state;
  }
};

export const setpendingcallalerts = (state = [], action: any) => {
  switch (action.type) {
    case SET_PENDING_CALL_ALERTS:
      var newState = [...state, action.payload.pendingcallalerts];
      return newState;
    case REMOVE_PENDING_CALL_ALERTS:
      var newFilterState = state.filter(
        (flt: any) => flt.callID != action.payload.callID,
      );
      return newFilterState;
    case CLEAR_PENDING_CALL_ALERTS:
      return action.payload.clearstate;
    default:
      return state;
  }
};

export const setactiveuserslist = (state = [], action: any) => {
  switch (action.type) {
    case SET_ACTIVE_USERS_LIST:
      return action.payload.activeuserslist;
    case UPDATE_ACTIVE_USERS_LIST:
      var updatedUser = action.payload.updatedUser;
      var newState = state.filter((mp: any) => mp._id != updatedUser._id);
      return [...newState, updatedUser];
    default:
      return state;
  }
};

export const setrejectedcalllist = (state = [], action: any) => {
  switch (action.type) {
    case SET_REJECTED_CALL_LIST:
      var conversationID = action.payload.callID;
      return [...state, conversationID];
    case REMOVE_REJECTED_CALL_LIST:
      var conversationID = action.payload.callID;
      var filterRejects = state.filter((flt) => flt != conversationID);
      return filterRejects;
    default:
      return state;
  }
};

export const setmediatrackholder = (state = [], action: any) => {
  switch (action.type) {
    case MEDIA_TRACK_HOLDER:
      return action.payload.mediatrackholder;
    default:
      return state;
  }
};

export const setmediamyvideoholder = (state = null, action: any) => {
  switch (action.type) {
    case MEDIA_MY_VIDEO_HOLDER:
      return action.payload.mediamyvideoholder;
    default:
      return state;
  }
};

export const setpostsfeedlist = (state: any[] = [], action: any) => {
  switch (action.type) {
    case SET_POSTS_FEED_LIST:
      return action.payload.postsfeedlist;
    case SET_MUTATE_POSTS_FEED_LIST:
      return [...state, action.payload.newpostfeedlist];
    default:
      return state;
  }
};

export const setistypinglist = (state: any[] = [], action: any) => {
  switch (action.type) {
    case SET_IS_TYPING_LIST:
      const filtrationstatus = state.filter(
        (flt: any) =>
          flt.userID !== action.payload.istyping.userID &&
          flt.conversationID !== action.payload.istyping.conversationID,
      );
      return [...filtrationstatus, action.payload.istyping];
    case SET_REMOVE_IS_TYPING_LIST:
      const filtrationstatusremove = state.filter(
        (flt: any) =>
          flt.userID !== action.payload.istyping.userID &&
          flt.conversationID !== action.payload.istyping.conversationID,
      );
      return filtrationstatusremove;
    default:
      return state;
  }
};

export const setemojilist = (state: Emoji[] = [], action: any) => {
  switch (action.type) {
    case SET_EMOJIS_LIST:
      const emojis = action.payload.emojis;
      const parsedEmoji: Emoji[] = emojis.map((mp: any) => ({
        ...mp,
        emoji_tags: JSON.parse(mp.emoji_tags),
      }));

      return parsedEmoji;
    default:
      return state;
  }
};

export const setminimizedconversation = (state: any = [], action: any) => {
  switch (action.type) {
    case SET_MINIMIZED_CONVERSATION:
      const conversation = action.payload.conversation;
      const finalset = state.filter(
        (flt: any) => flt.conversationid !== conversation.conversationid,
      );

      return [...finalset, conversation];
    case SET_MINIMIZED_CONVERSATION_OVERRIDE:
      return action.payload.conversations;
    case CLOSE_MINIMIZED_CONVERSATION:
      const conversationID = action.payload.conversationID;
      const setToRemove = state.filter(
        (flt: any) => flt.conversationid !== conversationID,
      );

      return setToRemove;
    default:
      return state;
  }
};

export const setpagemodal = (state: IPageModal | null = null, action: any) => {
  switch (action.type) {
    case SET_PAGE_MODAL:
      return action.payload.pagemodal;
    default:
      return state;
  }
};

export const setusersettings = (
  state: IUserSettings = usersettingsstate,
  action: any,
) => {
  switch (action.type) {
    case SET_USER_SETTINGS:
      return action.payload.usersettings;
    default:
      return state;
  }
};

export const setcoordinates = (
  state: ICoordinatesAnchor[] = [],
  action: any,
) => {
  switch (action.type) {
    case SET_COORDINATES:
      const currentCoordinates: ICoordinatesAnchor = action.payload.coordinates;
      const prevNoUser = state.filter(
        (flt: ICoordinatesAnchor) =>
          flt.referenceID !== currentCoordinates.referenceID,
      );
      return [...prevNoUser, currentCoordinates];
    default:
      return state;
  }
};

export const setrawcoordinates = (
  state: ICoordinatesAnchor[] = [],
  action: any,
) => {
  switch (action.type) {
    case SET_RAW_COORDINATES:
      return action.payload.rawcoordinates;
    default:
      return state;
  }
};

export const setpreviewparticipant = (
  state: IPreviewParicipants[] = [],
  action: any,
) => {
  switch (action.type) {
    case SET_PREVIEW_PARTICIPANTS:
      const new_participant: IPreviewParicipants =
        action.payload.previewparticipant;
      const final_state = state.filter(
        (flt) =>
          flt.channelID !== new_participant.channelID &&
          flt.clientID !== new_participant.clientID,
      );
      return [...final_state, new_participant];
    case SET_PREVIEW_PARTICIPANTS_BULK:
      const incomingParticipants: IPreviewParicipants[] =
        action.payload.participants;

      const incomingClientIDs = new Set(
        incomingParticipants.map((p) => p.clientID),
      );

      const filteredState = state.filter(
        (existing) => !incomingClientIDs.has(existing.clientID),
      );

      return [...filteredState, ...incomingParticipants];
    case REMOVE_PREVIEW_PARTICIPANT:
      const left_participant: IPreviewParicipants =
        action.payload.previewparticipant;
      const final_left_state = state.filter(
        (flt) => flt.clientID !== left_participant.clientID,
      );
      return final_left_state;
    default:
      return state;
  }
};
