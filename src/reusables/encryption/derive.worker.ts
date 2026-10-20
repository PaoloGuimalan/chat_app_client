import { argon2id } from 'hash-wasm';
import { binary, validateProfile } from './crypto';
self.onmessage = async (event: MessageEvent) => {
  let password: Uint8Array | undefined;
  let key: Uint8Array | undefined;
  try {
    const {phrase,profile,salt} = event.data;
    validateProfile(profile);
    password = new TextEncoder().encode(phrase);
    if (!password.length || password.length > 1024) throw new Error('Invalid passphrase length.');
    key = await argon2id({password,salt:binary(salt,16),memorySize:65536,iterations:3,parallelism:1,hashLength:32,outputType:'binary'});
    const imported = await crypto.subtle.importKey('raw',Uint8Array.from(key),'AES-GCM',false,['encrypt','decrypt']);
    self.postMessage({key:imported});
  } catch { self.postMessage({error:'Could not derive encryption key.'}); }
  finally { password?.fill(0); key?.fill(0); self.close(); }
};
