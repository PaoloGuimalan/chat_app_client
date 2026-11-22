import { firstPartyClient } from './requests';
import envs from './env_configs';
import type { RealmLifecycle, RecoveryPage } from '../vars/realmLifecycle';

const base = () => `${envs.USER_SERVICE_API}/api/realm/realms`;
const headers = () => ({ 'x-access-token': localStorage.getItem('authtoken') });
const url = (id: string, action: string) => `${base()}/${encodeURIComponent(id)}/${action}`;
export async function getRealmLifecycle(id: string, signal?: AbortSignal) {
  return (await firstPartyClient.get<{result: RealmLifecycle}>(url(id, 'lifecycle'), {headers: headers(), signal})).data.result;
}
export async function deactivateRealm(id: string) {
  return (await firstPartyClient.post(url(id, 'deactivate'), {}, {headers: headers()})).data.result;
}
export async function deleteRealm(id: string, confirmName: string) {
  return (await firstPartyClient.post(url(id, 'delete'), {confirm_name: confirmName}, {headers: headers()})).data.result;
}
export async function listDeactivatedRealms(cursor?: string, signal?: AbortSignal) {
  return (await firstPartyClient.get<{result: RecoveryPage}>(`${base()}/deactivated`, {headers: headers(), params: {cursor}, signal})).data.result;
}
export async function reactivateRealm(id: string, actorEntityId: string) {
  return (await firstPartyClient.post(url(id, 'reactivate'), {actor_entity_id: actorEntityId}, {headers: headers()})).data.result;
}
