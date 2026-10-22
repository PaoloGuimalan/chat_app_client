import { firstPartyClient } from '../hooks/requests';
import envs from '../hooks/env_configs';
import { configurationSupportsPurpose, validateConfiguration, validateProfile, type Configuration, type Owner } from './crypto';
export interface Purpose { purpose: string; label: string; is_active: boolean; configurations: Configuration[]; active_configuration_id: string | null; scope_version: string }
export interface EncryptionSettings { owner: Owner; supported_profile: Configuration; purposes: Purpose[]; configurations?: Configuration[]; scope_version?: string; consumer_capabilities?: {diary?: {format_version: number}} }
const endpoint = () => `${envs.USER_SERVICE_API}/api/entity/encryption-configurations/personal/`;
const options = () => ({headers:{'x-access-token':localStorage.getItem('authtoken') || ''}});
export async function loadConfigurations(purpose?: string): Promise<EncryptionSettings> {
  const {data} = await firstPartyClient.get(endpoint(),{...options(),...(purpose===undefined?{}:{params:{purpose}})});
  if (data.status !== true || !data.result?.owner || !Array.isArray(data.result.purposes)) throw new Error('Could not load passphrase settings.');
  validateProfile(data.result.supported_profile);
  const purposes = data.result.purposes as Purpose[];
  if (purpose !== undefined && (purposes.length !== 1 || purposes[0].purpose !== purpose)) throw new Error('Invalid passphrase settings.');
  const activeIds = new Set<string>();
  if (data.result.configurations !== undefined) {
    if (!Array.isArray(data.result.configurations) || !/^[0-9a-f]{64}$/.test(data.result.scope_version)) throw new Error('Invalid passphrase settings.');
    const ids = new Set<string>();
    for (const config of data.result.configurations as Configuration[]) {
      validateConfiguration(config,data.result.owner);
      if (ids.has(config.id)) throw new Error('Invalid passphrase settings.');
      ids.add(config.id);
      if (config.is_active) activeIds.add(config.id);
    }
  }
  for (const group of purposes) {
    if (group.is_active === undefined) group.is_active = true;
    if (typeof group.is_active !== 'boolean') throw new Error('Invalid passphrase settings.');
    if (typeof group.purpose !== 'string' || !group.purpose.length || !Array.isArray(group.configurations) || !/^[0-9a-f]{64}$/.test(group.scope_version)) throw new Error('Invalid passphrase settings.');
    for (const config of group.configurations) {
      validateConfiguration(config,data.result.owner);
      if (!configurationSupportsPurpose(config,group.purpose)) throw new Error('Invalid passphrase settings.');
      if (config.is_active) activeIds.add(config.id);
    }
    const active = group.configurations.filter(config=>config.is_active);
    if (active.length > 1 || (active[0]?.id ?? null) !== group.active_configuration_id) throw new Error('Inconsistent active passphrase settings.');
  }
  if (activeIds.size > 1) throw new Error('Inconsistent active passphrase settings.');
  return data.result;
}
export async function loadConfiguration(id: string, purpose: string, owner: Owner): Promise<Configuration> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) throw new Error('Invalid passphrase configuration.');
  const {data} = await firstPartyClient.get(`${endpoint()}${id}/`,{...options(),params:{purpose}});
  const config = data.result?.configuration as Configuration | undefined;
  if (data.status !== true || !config || config.id !== id) throw new Error('Could not load the original passphrase configuration.');
  validateConfiguration(config,owner);
  return config;
}
export async function changeConfiguration(action: 'register'|'rename'|'activate'|'deactivate'|'uses', id: string, payload: Record<string, unknown>): Promise<EncryptionSettings> {
  const url = action === 'register' ? endpoint() : `${endpoint()}${id}/${action === 'rename' ? '' : `${action}/`}`;
  const {data} = action === 'rename' ? await firstPartyClient.patch(url,payload,options()) : await firstPartyClient.post(url,payload,options());
  if (data.status !== true || !data.result?.scope_version) throw new Error('Could not update passphrase settings.');
  return loadConfigurations();
}
export function isStale(error: unknown) { return (error as {response?: {data?: {code?: string}}})?.response?.data?.code === 'stale_scope'; }
