export const PROFILE = {
  format_version: 1, kdf_algorithm: 'argon2id', cipher_algorithm: 'aes-256-gcm',
  kdf_parameters: { version: 19, memory_kib: 65536, iterations: 3, parallelism: 1, output_length: 32 },
} as const;
export interface Owner { entity_id: string; user_id: string }
export function isPurposeActive(purpose?: {is_active?: boolean}) { return purpose?.is_active !== false; }
export interface Configuration extends Owner {
  id: string; name: string; purpose: string; is_active: boolean; created_at: string;
  verification_purpose?: string; purposes?: string[];
  format_version: number; kdf_algorithm: string; cipher_algorithm: string;
  kdf_parameters: Record<string, number>; salt: string;
  verification_nonce: string; verification_ciphertext: string; verification_aad: string;
}
const utf8 = new TextEncoder();
const decode = new TextDecoder('utf-8', { fatal: true });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function validateNewPassphrase(value: string) {
  if ([...value].length < 15 || utf8.encode(value).length > 1024) throw new Error('Use at least 15 characters and at most 1,024 UTF-8 bytes.');
}
export function validateProfile(value: {format_version: number; kdf_algorithm: string; cipher_algorithm: string; kdf_parameters: Record<string, number>}) {
  if (value.format_version !== 1 || value.kdf_algorithm !== 'argon2id' || value.cipher_algorithm !== 'aes-256-gcm' || !value.kdf_parameters || Object.keys(value.kdf_parameters).length !== 5 || Object.entries(PROFILE.kdf_parameters).some(([k,v]) => value.kdf_parameters[k] !== v)) throw new Error('Unsupported encryption profile. Update the app before continuing.');
}
export function base64(value: Uint8Array) { let raw = ''; value.forEach(byte => raw += String.fromCharCode(byte)); return btoa(raw); }
export function binary(value: string, min: number, max = min): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length > 4 * Math.ceil(max / 3)) throw new Error('Invalid encrypted data.');
  const bytes = Uint8Array.from(atob(value), char => char.charCodeAt(0));
  if (bytes.length < min || bytes.length > max || base64(bytes) !== value) throw new Error('Invalid encrypted data.');
  return bytes;
}
function ownerCheck(owner: Owner) { if (![owner.entity_id,owner.user_id].every(value=>typeof value==='string' && value.length>0 && value.length<=40)) throw new Error('Invalid encryption owner.'); }
export function configurationSupportsPurpose(config: Configuration, purpose: string) { return (config.purposes ?? [config.purpose]).includes(purpose); }
export function validateConfiguration(config: Configuration, owner: Owner) {
  validateProfile(config);
  if (config.purposes !== undefined && (!Array.isArray(config.purposes) || config.purposes.some(purpose=>typeof purpose!=='string' || !purpose.length) || new Set(config.purposes).size !== config.purposes.length)) throw new Error('Invalid passphrase configuration.');
  if (config.entity_id !== owner.entity_id || config.user_id !== owner.user_id || config.verification_aad !== verificationAAD(owner,config.id,config.verification_purpose ?? config.purpose) || typeof config.is_active !== 'boolean') throw new Error('Invalid passphrase configuration.');
  binary(config.salt,16); binary(config.verification_nonce,12); binary(config.verification_ciphertext,17,1024);
}
export function verificationAAD(owner: Owner, id: string, purpose = 'diary') { ownerCheck(owner); if (!uuid.test(id) || typeof purpose !== 'string' || !purpose.length) throw new Error('Invalid configuration.'); return JSON.stringify(['chatterloop.encryption.verification',1,id,owner.entity_id,owner.user_id,purpose]); }
async function seal(value: string, aad: string, key: CryptoKey) {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:utf8.encode(aad),tagLength:128},key,utf8.encode(value));
  return {nonce:base64(nonce),ciphertext:base64(new Uint8Array(encrypted))};
}
async function open(nonce: string, ciphertext: string, aad: string, key: CryptoKey) {
  return decode.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:binary(nonce,12),additionalData:utf8.encode(aad),tagLength:128},key,binary(ciphertext,16,4*1024*1024)));
}
export async function createVerification(owner: Owner, id: string, key: CryptoKey, purpose = 'diary') {
  const token = crypto.getRandomValues(new Uint8Array(32));
  try {
    const aad = verificationAAD(owner,id,purpose);
    const value = JSON.stringify({marker:'chatterloop.encryption.verification.v1',token:base64(token)});
    const encrypted = await seal(value,aad,key);
    if (await open(encrypted.nonce,encrypted.ciphertext,aad,key) !== value) throw new Error('Could not verify encryption.');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256',token));
    return {verification_aad:aad,verification_nonce:encrypted.nonce,verification_ciphertext:encrypted.ciphertext,verification_digest:[...digest].map(b=>b.toString(16).padStart(2,'0')).join('')};
  } finally { token.fill(0); }
}
export async function verifyConfiguration(config: Configuration, owner: Owner, key: CryptoKey) {
  validateProfile(config);
  const aad = verificationAAD(owner,config.id,config.verification_purpose ?? config.purpose);
  if (config.entity_id !== owner.entity_id || config.user_id !== owner.user_id || config.verification_aad !== aad) throw new Error('Configuration owner does not match.');
  binary(config.verification_ciphertext,17,1024);
  const value = JSON.parse(await open(config.verification_nonce,config.verification_ciphertext,aad,key));
  if (value.marker !== 'chatterloop.encryption.verification.v1') throw new Error('Could not verify passphrase.');
  const token = binary(value.token,32); token.fill(0);
  return value.token as string;
}
interface Envelope { v: number; configuration_id: string; entry_binding: string; nonce: string; ciphertext: string }
export function entryEnvelopes(entry: {title: string; content: string}) {
  const parse = (value: string, maximum: number): Envelope => {
    if (typeof value !== 'string' || value.length > maximum * 2 + 512) throw new Error('Invalid encrypted entry.');
    const e = JSON.parse(value);
    if (!e || typeof e !== 'object' || Object.keys(e).length !== 5 || e.v !== 1 || !uuid.test(e.configuration_id) || !uuid.test(e.entry_binding)) throw new Error('Unsupported encrypted entry.');
    binary(e.nonce,12); binary(e.ciphertext,16,maximum); return e;
  };
  const title = parse(entry.title,16*1024), content = parse(entry.content,2*1024*1024);
  if (title.configuration_id !== content.configuration_id || title.entry_binding !== content.entry_binding || title.nonce === content.nonce) throw new Error('Encrypted entry fields do not match.');
  return {title,content};
}
function fieldAAD(owner: Owner, e: Pick<Envelope,'configuration_id'|'entry_binding'>, field: string) { ownerCheck(owner); return JSON.stringify(['chatterloop.diary.field',1,owner.entity_id,owner.user_id,e.configuration_id,e.entry_binding,field]); }
export async function encryptEntry(entry: {title: string; content: string}, owner: Owner, configuration_id: string, key: CryptoKey) {
  if (!uuid.test(configuration_id)) throw new Error('Invalid configuration.');
  if (utf8.encode(entry.title).length + 16 > 16*1024 || utf8.encode(entry.content).length + 16 > 2*1024*1024) throw new Error('This entry is too large to encrypt. Shorten its title or writing.');
  const shared = {v:1,configuration_id,entry_binding:crypto.randomUUID()};
  const title = {...shared,...await seal(entry.title,fieldAAD(owner,shared,'title'),key)};
  const content = {...shared,...await seal(entry.content,fieldAAD(owner,shared,'content'),key)};
  return {title:JSON.stringify(title),content:JSON.stringify(content),is_encrypted:true,is_private:true};
}
export async function decryptEntry<T extends {title: string; content: string}>(entry: T, owner: Owner, key: CryptoKey): Promise<T> {
  const e = entryEnvelopes(entry);
  const title = await open(e.title.nonce,e.title.ciphertext,fieldAAD(owner,e.title,'title'),key);
  const content = await open(e.content.nonce,e.content.ciphertext,fieldAAD(owner,e.content,'content'),key);
  return {...entry,title,content};
}
