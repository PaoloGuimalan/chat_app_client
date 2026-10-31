import { useEffect, useState } from "react";
import { GetRoleDefinitionsRequest } from "@/reusables/hooks/requests";
import type { RoleDefinition } from "../vars/roles";

export function useRoleDefinitions(enabled = true) {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setLoading(true);
    setError(false);
    GetRoleDefinitionsRequest().then((result) => {
      if (current) setRoles(result);
    }).catch(() => {
      if (current) { setRoles([]); setError(true); }
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [enabled, revision]);
  return { roles, loading, error, reload: () => setRevision((value) => value + 1) };
}
