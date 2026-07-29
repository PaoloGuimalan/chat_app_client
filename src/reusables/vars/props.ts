/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction } from "react";
import {
  ConversationInfoInterface,
  ICoordinatesAnchor,
  ServerChannelsListInterface,
  UserWithInfoConversationInterface,
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
  members: UserWithInfoConversationInterface[];
  setisReplying: (data: any) => void;
  setfullImageScreen: (data: any) => void;
  scrollBottom: () => void;
  setunreadmessages: Dispatch<SetStateAction<string[]>>;
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
  /**
   * Set on a thread opened via "Reply" (rather than "View replies") so only
   * that thread's composer takes focus.
   */
  autoFocusComposer?: boolean;
  /**
   * Fired by a thread after it posts a reply, so the parent row's reply count
   * keeps up without refetching the whole comment list.
   */
  onCommentPosted?: () => void;
  /**
   * Signed change to the POST's total comment count (+1 per comment or reply
   * added, negative by the whole thread when a comment is deleted). Lets the
   * host card update `score.comments_count` without refetching the post.
   */
  onCommentCountChange?: (delta: number) => void;
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
    username: string;
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
