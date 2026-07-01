/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  IContact,
  IEntry,
  IPost,
  IPostComment,
} from "@/reusables/vars/interfaces";
import { PaginationProp } from "@/reusables/vars/props";

export const authenticationstate: AuthenticationInterface = {
  auth: null,
  user: {
    id: "",
    username: "",
    profile: "",
    coverphoto: "",
    userID: "",
    fullName: {
      firstName: "",
      middleName: "",
      lastName: "",
    },
    birthdate: null,
    gender: null,
    email: "",
    isActivated: null,
    isVerified: null,
    isComplete: false,
    entity_id: "",
    pendingConsents: [],
  },
};

export const conversationsetupstate = {
  conversationid: null,
  userdetails: {
    userID: "",
    fullname: {
      firstName: "",
      middleName: "",
      lastName: "",
    },
    profile: "",
  },
  groupdetails: {
    groupName: "",
    receivers: [],
    profile: "",
  },
  type: "",
};

export const screensizelistenerstate = {
  W: window.innerWidth,
  H: window.innerHeight,
};

export const contactsliststate: PaginationProp<IContact> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export const postsliststate: PaginationProp<IPost> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export const commentsliststate: PaginationProp<IPostComment> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export const entriesliststate: PaginationProp<IEntry> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export const genericpaginationstate: PaginationProp<any> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export const usersettingsstate = {
  personal_info: null,
  map_feed_access: {
    enable_location: false,
    share_location: false,
    current_mode: 0,
    toggleSpeed: false,
  },
  messages: {
    type: "common",
  },
};
