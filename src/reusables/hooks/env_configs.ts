// src/config/envs.ts
import { secureVault } from "./secureVault";

/**
 * Interface definition representing the environment configurations
 * accessible across your application codebase components.
 */
interface EnvSchema {
  readonly GOOGLE_CLIENT_ID: string;
  readonly CHATTERLOOP_API: string;
  readonly USER_SERVICE_API: string;
  readonly SECRET: string;
  readonly OPEN_ROUTE_API: string;
  readonly OPEN_ROUTE_API_KEY: string;
  readonly TURN_SERVER_URL: string;
  readonly TURN_SERVER_USERNAME: string;
  readonly TURN_SERVER_CREDENTIAL: string;
  readonly APP_VERSION: string;
}

/**
 * Pure memory sandbox extractor utility.
 * Fetches the variable on-demand straight out of the active closure space.
 * 
 * @param vaultKey - The target key string to look up from the locked memory state
 * @returns A guaranteed plain string value
 */
const pick = (vaultKey: string): string => {
  const sandbox = secureVault.getAll();
  return sandbox[vaultKey] || "";
};

/**
 * Unified Dynamic Environment Variable Bridge
 * Utilizing Object.defineProperties configures these fields as active getters.
 * This guarantees that whenever an execution call reads 'envs.SECRET', it fetches
 * the live decrypted state rather than a dead string evaluated at application boot.
 */
const envs = {} as EnvSchema;

Object.defineProperties(envs, {
  GOOGLE_CLIENT_ID: { get: () => pick("VITE_PUBLIC_GOOGLE_CLIENT_ID"), enumerable: true },
  CHATTERLOOP_API: { get: () => pick("VITE_PUBLIC_CHATTERLOOP_API"), enumerable: true },
  USER_SERVICE_API: { get: () => pick("VITE_PUBLIC_CHATTERLOOP_USER_SERVICE_API"), enumerable: true },
  SECRET: { get: () => pick("VITE_SECRET_JWT_SECRET"), enumerable: true },
  OPEN_ROUTE_API: { get: () => pick("VITE_PUBLIC_OPEN_ROUTE_API"), enumerable: true },
  OPEN_ROUTE_API_KEY: { get: () => pick("VITE_SECRET_OPEN_ROUTE_API_KEY"), enumerable: true },
  TURN_SERVER_URL: { get: () => pick("VITE_PUBLIC_TURN_SERVER_URL"), enumerable: true },
  TURN_SERVER_USERNAME: { get: () => pick("VITE_SECRET_TURN_SERVER_USERNAME"), enumerable: true },
  TURN_SERVER_CREDENTIAL: { get: () => pick("VITE_SECRET_TURN_SERVER_CREDENTIAL"), enumerable: true },
  APP_VERSION: { get: () => pick("VITE_PUBLIC_APP_VERSION") || "dev", enumerable: true }
});

export default envs;
