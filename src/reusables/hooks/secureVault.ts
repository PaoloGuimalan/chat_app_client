// src/services/secureVault.ts

/**
 * A completely dynamic dictionary type representing any string-based
 * environment variable keys swept by your server.
 */
export type SecureEnvs = Record<string, string | undefined>;

/**
 * Isolated Module Memory Closure Vault
 * Keeps both public configurations and decrypted secrets locked away inside
 * a private RAM execution scope that cannot be traversed or scraped from the global window object.
 */
export const secureVault = (() => {
  // A clean, completely unreferenced plain JavaScript object in memory
  let envStore: SecureEnvs = {};

  return {
    /**
     * Locks both public and decrypted secret configurations into the plain object store.
     * This is invoked strictly once during the root App.tsx mounting lifecycle hook.
     *
     * @param publicEnvs - The plain-text VITE_PUBLIC_* variables object
     * @param secretEnvs - The freshly decrypted VITE_SECRET_* credentials object
     */
    lock: (publicEnvs: SecureEnvs, secretEnvs: SecureEnvs): void => {
      envStore = {
        ...publicEnvs,
        ...secretEnvs,
      };
    },

    /**
     * Returns the entire unified configuration dictionary object directly inside
     * the active calling execution memory stack block context.
     *
     * @returns The dynamic plain object containing all your loaded environment variables
     */
    getAll: (): SecureEnvs => {
      return envStore;
    },
  };
})();
