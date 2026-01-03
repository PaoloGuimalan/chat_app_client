/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ConversationInfoInterface,
  ICoordinatesAnchor,
  ServerChannelsListInterface,
} from "./interfaces";

export interface MessageOptionsProp {
  messageID: string;
  conversationID: string;
  type: string;
  setisReplying: () => void;
}

export interface ContentHandlerProp {
  i: number;
  cnvs: any;
  conversationsetup: any;
  setisReplying: (data: any) => void;
  setfullImageScreen: (data: any) => void;
  scrollBottom: () => void;
  theme: any;
}

export interface ConversationInfoModalProp {
  conversationinfo: ConversationInfoInterface;
  onclose: any;
}

export interface ServerInfoModalProp {
  serverdetails: ServerChannelsListInterface;
  onclose: any;
}

export interface AppItemProp {
  mp: any;
}

export interface PostCommentProp {
  post_id: string;
  parent_id: string | null;
}

export interface PaginationProp<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProfilePopupProp {
  coordinates: {
    longitude: number;
    latitude: number;
  };
  user: {
    userID: string;
    fullName: {
      firstName: string;
      middleName: string;
      lastName: string;
    };
    email: string;
    isActivated: boolean | null;
    isVerified: boolean | null;
    profile: string;
    coverphoto: string;
  };
}

export interface SpeedPopupProp {
  coordinates: ICoordinatesAnchor;
  maxSpeed: number;
}

export interface CachedImageProp {
  src?: string;
  className?: string;
  id?: string;
  onLoad?: () => void;
  onClick?: () => void;
}
