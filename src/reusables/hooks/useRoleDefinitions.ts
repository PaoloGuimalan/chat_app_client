import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { GetRoleDefinitionsRequest } from "@/reusables/hooks/requests";
import type { RoleDefinition } from "../vars/roles";

export function useRoleDefinitions(enabled = true, realmId?: string) {
  const actor = useSelector((state: any) => state.authentication.active_entity_context?.id ?? state.authentication.user?.entity_id);
  const scope = JSON.stringify([actor, realmId]);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setRoles([]);
    setLoadedScope(null);
    setLoading(true);
    setError(false);
    GetRoleDefinitionsRequest(realmId).then((result) => {
      if (current) { setRoles(result); setLoadedScope(scope); }
    }).catch(() => {
      if (current) { setRoles([]); setError(true); }
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [enabled, revision, scope, realmId]);
  useEffect(() => {
    if (!enabled) return;
    const reload = () => setRevision((value) => value + 1);
    document.addEventListener("reload-realm-members", reload);
    return () => document.removeEventListener("reload-realm-members", reload);
  }, [enabled]);
  return { roles: enabled && loadedScope === scope ? roles : [], loading, error, reload: () => setRevision((value) => value + 1) };
}
