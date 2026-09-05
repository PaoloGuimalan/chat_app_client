/* eslint-disable @typescript-eslint/no-explicit-any */
import sign from "jwt-encode";
import { useEffect, useRef } from "react";
import envs from "./env_configs";

const API = envs.CHATTERLOOP_API;
const SECRET = envs.SECRET;

/**
 * Live activity on ONE post - comments as they are written, and who is typing.
 *
 * A SECOND stream, deliberately separate from the notification SSE in sse.ts.
 * That one is opened once per session and addressed to the signed-in entity;
 * this one is opened per post and addressed to the post. They answer different
 * questions: "did something happen that concerns me" versus "did something
 * happen here", and a comment on a post you are reading is usually neither
 * yours nor about you.
 *
 * ONLY THE POST'S OWN SURFACES OPEN IT. The newsfeed renders many post cards at
 * once; if the comment section opened one of these on mount, a single scroll
 * would leave dozens of live connections behind. So the caller has to say
 * `enabled` explicitly, and only the post modal and /post/:id do - which is
 * also the only place a live comment could be seen anyway.
 */

export type PostActivityType = "comment" | "typing" | "reaction" | "share";

export interface PostActivityActor {
  entity_id: string;
  handle: string | null;
  name: string | null;
  type: string | null;
}

export interface PostActivityEvent {
  post_id: string;
  event_type: PostActivityType | string;
  /** Present on "comment", and on a "reaction" whose target is a comment. */
  comment_id?: string;
  /**
   * Which list the event is about, on "comment" and "typing" alike - null for
   * the post's top-level comments, otherwise a top-level comment's id meaning
   * that comment's thread.
   *
   * On a "comment" this is the thread the new row LANDED in, which is not
   * necessarily the comment its author aimed at: replying to a reply
   * re-parents onto the top-level ancestor. On a "typing" it is the box being
   * typed in.
   */
  parent_id?: string | null;
  /**
   * What a "reaction" was aimed at. The post's tallies and a comment's
   * tallies are different rows behind different endpoints, so this is what
   * says which one to refetch.
   */
  target_type?: "post" | "comment";
  /**
   * "added" | "updated" | "removed", on a "reaction". Descriptive only -
   * tallies are refetched rather than derived from it, since a swap moves two
   * rows and a concurrent reaction may have landed in between.
   */
  action?: string;
  entity?: PostActivityActor;
}

/**
 * Subscribes to `postID`'s activity for as long as `enabled` holds.
 *
 * `onEvent` is held in a ref rather than being a dependency, so a handler that
 * closes over changing state does not tear the connection down and rebuild it
 * on every render - the stream's lifetime is tied to the post and to `enabled`,
 * and to nothing else.
 */
export const usePostActivityStream = (
  postID: string | null | undefined,
  enabled: boolean,
  onEvent: (event: PostActivityEvent) => void,
) => {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !postID) return;

    const authtoken = localStorage.getItem("authtoken");
    // Guests can read a public post's comments but get no live updates: the
    // stream is authenticated, because who is typing on a post is not
    // something to hand out to an unidentified reader.
    if (!authtoken) return;

    const encodedPayload = sign(
      {
        token: authtoken,
        deviceToken: localStorage.getItem("device"),
        type: "post_activity",
        post_id: postID,
      },
      SECRET,
    );

    const source = new EventSource(
      `${API}/posts/ssePostActivity/${encodedPayload}`,
    );

    const relay = (e: any) => {
      try {
        const parsed = JSON.parse(e.data);
        if (!parsed.auth || !parsed.status) return;
        if (!parsed.result?.event_type) return;

        handlerRef.current(parsed.result as PostActivityEvent);
      } catch {
        // A frame we cannot parse is a frame we cannot act on. Dropping it
        // costs one missed refresh; throwing out of an event listener would
        // leave the stream alive but the page in an unknown state.
      }
    };

    source.addEventListener("post_activity", relay);

    return () => {
      source.removeEventListener("post_activity", relay);
      source.close();
    };
  }, [postID, enabled]);
};
