/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction } from "react";
import { PostActivityEvent } from "@/reusables/hooks/postRealtime";
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
   * Handle to pre-fill as "@handle" when a thread is opened via "Reply", so
   * the person being replied to is actually notified. Null when there is
   * nothing worth inserting - your OWN comment, or a missing handle.
   *
   * Only meaningful alongside `autoFocusComposer`: opening a thread via
   * "View replies" is reading, not replying, and must not touch the composer.
   */
  initialMention?: string | null;
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
  /**
   * Open a live stream for this post - comments appearing as they are written,
   * and a "typing" indicator.
   *
   * OPT-IN, and off by default, because the connection is per post rather than
   * per session: the newsfeed renders many post cards at once, and a comment
   * section that subscribed on mount would leave one live connection behind
   * per card scrolled past. Only the surfaces that show a single post in full
   * - the post modal and /post/:id - set this.
   *
   * Ignored by a thread (`parent_id` set): a thread is a nested instance of
   * this same component, and the top-level one is already listening on the
   * post's channel for all of them.
   */
  realtime?: boolean;
  /**
   * The last event from the live stream that an open THREAD might need, handed
   * down from the top-level instance.
   *
   * Only the top-level instance holds the post's connection (see `realtime`),
   * but a reply belongs in a thread's list and a reaction may be on a row a
   * thread is showing - and those threads are children of this component.
   * Passing the event down is what lets one connection serve every open
   * thread; each one decides for itself whether the event is about a row it
   * holds.
   *
   * `nonce` exists so two events of the same kind are two distinct values -
   * without it the second would compare equal to the first and the thread
   * would never react to it.
   */
  remoteActivity?: {
    event: PostActivityEvent;
    nonce: number;
  } | null;
  /**
   * Somebody else reacted to the POST (not to a comment).
   *
   * Handed UP, because the post's reaction tallies live on whichever card or
   * modal owns the post - this component owns comments. It is reported from
   * here because the stream is held here: the comment section is the one child
   * mounted on every surface that shows a post in full, which is exactly the
   * set of surfaces that open the stream.
   */
  onPostReaction?: () => void;
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
