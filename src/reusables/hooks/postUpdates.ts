import { useEffect, useRef } from "react";
import type { PostPatch } from "./postEditing";
import type { IPost } from "../vars/interfaces";

let scope = "";
const patches = new Map<string, PostPatch>();
const subscribers = new Set<(patch: PostPatch, token: string) => void>();

function session(token: string) {
  if (scope !== token) { scope = token; patches.clear(); }
  return patches;
}

/** Keep mounted cards and recently unmounted lists in step after an edit. */
export function publishPostUpdate(patch: PostPatch, token: string) {
  if (token !== localStorage.getItem("authtoken")) return;
  // Archive has its own controls and local state; never replay its snapshot
  // from a content/audience response over a later archive operation.
  const update = { ...patch };
  delete update.is_archived;
  const cache = session(token);
  cache.set(update.post_id, { ...cache.get(update.post_id), ...update });
  subscribers.forEach(listener => listener(update, token));
}

export function usePostUpdate(post: IPost, onUpdate: (patch: PostPatch) => void) {
  const latest = useRef(onUpdate);
  latest.current = onUpdate;
  const loadedPost = useRef(post);
  loadedPost.current = post;
  const postId = post.post_id;
  const token = localStorage.getItem("authtoken") || "";
  useEffect(() => {
    const cached = session(token).get(postId);
    const fetchedRevision = Date.parse(loadedPost.current.updated_at || "") || 0;
    const cachedRevision = Date.parse(cached?.updated_at || "") || 0;
    if (cached && fetchedRevision <= cachedRevision) latest.current(cached);
    else if (cached) patches.delete(postId);
    const listener = (patch: PostPatch, sourceToken: string) => {
      if (sourceToken === token && patch.post_id === postId) latest.current(patch);
    };
    subscribers.add(listener);
    return () => { subscribers.delete(listener); };
  }, [postId, token]);
}
