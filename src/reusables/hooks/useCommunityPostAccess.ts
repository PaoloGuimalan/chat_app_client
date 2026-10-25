/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { GetPostPreviewRequest } from "@/reusables/hooks/requests";
import type { IPost } from "../vars/interfaces";
/** Revalidate community content after access or acting identity changes. */
export function useCommunityPostAccess(post: Pick<IPost, "post_id" | "community">, accept: (post: IPost) => void) {
  const actor = useSelector((state: any) => state.authentication.active_entity_context?.id ?? state.authentication.user?.entity_id);
  const [access, setAccess] = useState({ actor, allowed: true });
  const previousActor = useRef(actor);
  const acceptRef = useRef(accept);
  const communityId = post.community?.realm_id;
  const isCommunity = Boolean(post.community);
  acceptRef.current = accept;
  useEffect(() => {
    if (!isCommunity)
      return;
    let active = true;
    let request = 0;
    const refresh = () => {
      const version = ++request;
      setAccess({ actor, allowed: false });
      GetPostPreviewRequest({ postID: post.post_id }).then(result => {
        if (!active || version !== request || !result || result.deleted_at)
          return;
        acceptRef.current(result);
        setAccess({ actor, allowed: true });
      }).catch(() => { });
    };
    if (previousActor.current !== actor) {
      previousActor.current = actor;
      refresh();
    }
    const changed = (event: Event) => {
      const realmId = (event as CustomEvent).detail?.realm_id;
      if (!realmId || realmId === communityId)
        refresh();
    };
    document.addEventListener("community-changed", changed);
    return () => {
      active = false;
      request++;
      document.removeEventListener("community-changed", changed);
    };
  }, [actor, post.post_id, communityId, isCommunity]);
  return !isCommunity || (access.actor === actor && access.allowed);
}
