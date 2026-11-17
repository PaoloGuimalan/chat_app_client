import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { GetProfileInfo } from "@/reusables/hooks/requests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import type { IRealmProfileInfo } from "@/reusables/vars/interfaces";

/** One current, acting-entity-scoped management snapshot for page and modal. */
export function useManagedRealm(realmId: string | undefined) {
  const actor = useSelector((s: { authentication: { active_entity_context?: { id?: string }; user: { entity_id: string } } }) =>
    s.authentication.active_entity_context?.id ?? s.authentication.user.entity_id);
  const token = localStorage.getItem('authtoken');
  const scope = `${realmId}:${actor}:${token}`;
  const currentScope = useRef(scope); currentScope.current = scope;
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ scope: string; isloaded: boolean; isError: boolean; realmInfo: IRealmProfileInfo | null }>(
    { scope, isloaded: false, isError: false, realmInfo: null });
  useEffect(() => {
    let active = true;
    setSnapshot({ scope, isloaded: false, isError: false, realmInfo: null });
    if (!realmId) return;
    GetProfileInfo({ userID: realmId }, { type: 'manage' }).then(response => {
      if (!active || currentScope.current !== scope || token !== localStorage.getItem('authtoken')) return;
      const realm = response?.data?.data;
      const valid = realm && realm.type !== 'user';
      setSnapshot({ scope, isloaded: true, isError: !valid, realmInfo: valid ? realm : null });
    }).catch(error => {
      if (!active || currentScope.current !== scope) return;
      setSnapshot({ scope, isloaded: true, isError: true, realmInfo: null });
      notifyRequestError(error, 'We couldn’t load these realm settings.');
    });
    return () => { active = false; };
  }, [scope, revision, realmId]);
  useEffect(() => {
    const changed = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.realm_id && String(detail.realm_id) !== realmId) return;
      if (detail?.event && !['reconnected', 'community_access_changed', 'community_members_changed', 'realm_access_changed', 'realm_members_changed'].includes(detail.event)) return;
      setRevision(value => value + 1);
    };
    document.addEventListener('reload-realm-members', changed);
    document.addEventListener('community-changed', changed);
    return () => { document.removeEventListener('reload-realm-members', changed); document.removeEventListener('community-changed', changed); };
  }, [realmId]);
  return snapshot.scope === scope ? snapshot : { isloaded: false, isError: false, realmInfo: null };
}
