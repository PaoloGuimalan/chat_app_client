import { firstPartyClient } from '../hooks/requests';
import envs from '../hooks/env_configs';
import { validateConfiguration, validateProfile, type Configuration, type Owner } from './crypto';
export interface Purpose { purpose: string; label: string; configurations: Configuration[]; active_configuration_id: string | null; scope_version: string }
export interface EncryptionSettings { owner: Owner; supported_profile: Configuration; purposes: Purpose[]; consumer_capabilities?: {diary?: {format_version: number}} }
const endpoint = () => `${envs.USER_SERVICE_API}/api/entity/encryption-configurations/personal/`;
const options = () => ({headers:{'x-access-token':localStorage.getItem('authtoken') || ''}});
export async function loadConfigurations(): Promise<EncryptionSettings> {
  const {data} = await firstPartyClient.get(endpoint(),options());
  if (data.status !== true || !data.result?.owner || !Array.isArray(data.result.purposes)) throw new Error('Could not load passphrase settings.');
  validateProfile(data.result.supported_profile);
  const purposes = data.result.purposes as Purpose[];
  if (!purposes.some(group=>group.purpose==='diary')) throw new Error('Diary protection settings are unavailable.');
  for (const group of purposes) {
    if (!Array.isArray(group.configurations) || !/^[0-9a-f]{64}$/.test(group.scope_version)) throw new Error('Invalid passphrase settings.');
    for (const config of group.configurations) validateConfiguration(config,data.result.owner);
    const active = group.configurations.filter(config=>config.is_active);
    if (active.length > 1 || (active[0]?.id ?? null) !== group.active_configuration_id) throw new Error('Inconsistent active passphrase settings.');
  }
  return data.result;
}
export async function changeConfiguration(action: 'register'|'rename'|'activate'|'deactivate', id: string, payload: Record<string, unknown>): Promise<Purpose> {
  const url = action === 'register' ? endpoint() : `${endpoint()}${id}/${action === 'rename' ? '' : `${action}/`}`;
  const {data} = action === 'rename' ? await firstPartyClient.patch(url,payload,options()) : await firstPartyClient.post(url,payload,options());
  if (data.status !== true || !data.result?.scope_version) throw new Error('Could not update passphrase settings.');
  return data.result;
}
export function isStale(error: unknown) { return (error as {response?: {data?: {code?: string}}})?.response?.data?.code === 'stale_scope'; }
