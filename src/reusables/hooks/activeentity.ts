// Helpers to switch the user's active identity (acting-as).
//
// Persists to localStorage and dispatches SET_ACTIVE_ENTITY so the axios
// interceptor (requests.ts) picks up the X-Acting-As header on every write.
// Supports ANY realm type (page/group/server/community/conference); the UI
// prioritizes pages but nothing here is page-specific.

import store from "../../redux/store";
import { SET_ACTIVE_ENTITY } from "../../redux/types";
import type { ActiveEntityState } from "../../redux/actions/states";
import { realmEntity } from "./entity";

export function setActiveEntity(entity: ActiveEntityState) {
  localStorage.setItem("activeEntity", JSON.stringify(entity));
  store.dispatch({ type: SET_ACTIVE_ENTITY, payload: { activeentity: entity } });
}

// The acting-as entity id is keyed on the realm's stable `realm_id` (a slug can
// be changed, so it must not key the actor). `slug` is carried in display only
// for navigating to the realm's profile.
export function actAsRealm(
  realmId: string,
  display: {
    name: string;
    profile: string;
    realmType?: string | null;
    slug?: string | null;
  },
) {
  setActiveEntity({
    entityId: realmEntity(realmId),
    entityType: "realm",
    display: { ...display, realm_id: realmId },
  });
}

export function actAsUser() {
  setActiveEntity({ entityId: null, entityType: "user", display: null });
}
