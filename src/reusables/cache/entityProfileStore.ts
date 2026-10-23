// Shared with the future standalone Studio app on the SAME origin.
// Store bytes, never an object URL (object URLs expire with their document).
export const ENTITY_PROFILE_DATABASE = "chatterloop_shared_media";
export const ENTITY_PROFILE_STORE = "entity_profiles";
export const ENTITY_PROFILE_VERSION = 1;

export interface EntityProfileRecord {
  entityId: string;
  blob: Blob;
  url: string;
  updatedAt: number;
}

export interface EntityProfileStore {
  get(entityId: string): Promise<EntityProfileRecord | undefined>;
  put(record: EntityProfileRecord): Promise<void>;
  remove(entityId: string): Promise<void>;
  clear(): Promise<void>;
}

let connection: Promise<IDBDatabase> | undefined;

function database(): Promise<IDBDatabase> {
  if (connection) return connection;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => { settled = true; reject(new Error("Avatar storage timed out")); }, 4000);
    const request = indexedDB.open(ENTITY_PROFILE_DATABASE, ENTITY_PROFILE_VERSION);
    const fail = () => { clearTimeout(timer); settled = true; reject(request.error || new Error("Avatar storage unavailable")); };
    request.onerror = fail;
    request.onblocked = fail;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ENTITY_PROFILE_STORE)) {
        request.result.createObjectStore(ENTITY_PROFILE_STORE, { keyPath: "entityId" });
      }
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      if (settled) { db.close(); return; }
      db.onversionchange = () => { db.close(); connection = undefined; };
      db.onclose = () => { connection = undefined; };
      resolve(db);
    };
  });
  connection = opening;
  void opening.catch(() => { if (connection === opening) connection = undefined; });
  return opening;
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(ENTITY_PROFILE_STORE, mode);
    let result: T;
    const request = operation(tx.objectStore(ENTITY_PROFILE_STORE));
    request.onsuccess = () => { result = request.result as T; };
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(tx.error || request.error || new Error("Avatar transaction aborted"));
    tx.onerror = () => reject(tx.error || request.error || new Error("Avatar transaction failed"));
  });
}

export const entityProfileStore: EntityProfileStore = {
  get: entityId => transaction("readonly", store => store.get(entityId)),
  put: record => transaction("readwrite", store => store.put(record)),
  remove: entityId => transaction("readwrite", store => store.delete(entityId)),
  clear: () => transaction("readwrite", store => store.clear()),
};
