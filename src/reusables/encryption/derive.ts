import { validateProfile, type Configuration, type PROFILE } from './crypto';
export function deriveKey(phrase: string, profile: Configuration | typeof PROFILE, salt: string, signal?: AbortSignal): Promise<CryptoKey> {
  validateProfile(profile);
  return new Promise((resolve,reject) => {
    if (signal?.aborted) { reject(new Error('Unlock cancelled.')); return; }
    const worker = new Worker(new URL('./derive.worker.ts',import.meta.url),{type:'module'});
    const clean = () => { worker.terminate(); signal?.removeEventListener('abort',abort); };
    const abort = () => { clean(); reject(new Error('Unlock cancelled.')); };
    signal?.addEventListener('abort',abort,{once:true});
    worker.onmessage = event => { clean(); if (event.data.key) resolve(event.data.key); else reject(new Error('Could not derive encryption key.')); };
    worker.onerror = () => { clean(); reject(new Error('Encryption unavailable. Use a current browser with secure HTTPS.')); };
    worker.postMessage({phrase,profile,salt});
  });
}
