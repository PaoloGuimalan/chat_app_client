import { IContact } from "@/reusables/vars/interfaces";
import { PaginationProp } from "@/reusables/vars/props";

export const authenticationstate = {
  auth: null,
  user: {
    userID: "",
    fullName: {
      firstName: "",
      middleName: "",
      lastName: "",
    },
    email: "",
    isActivated: null,
    isVerified: null,
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
