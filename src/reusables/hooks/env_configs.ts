// src/config/envs.ts
import { secureVault } from "./secureVault";

/**
 * Type declaration representing the internal key schema structure mapping
 * utilized across the application codebase components.
 */
interface EnvSchema {
  GOOGLE_CLIENT_ID: string;
  CHATTERLOOP_API: string;
  USER_SERVICE_API: string;
  SECRET: string;
  OPEN_ROUTE_API: string;
  OPEN_ROUTE_API_KEY: string;
  TURN_SERVER_URL: string;
  TURN_SERVER_USERNAME: string;
  TURN_SERVER_CREDENTIAL: string;
  APP_VERSION: string;
  [key: string]: string; // Fallback mapping protection
}

/**
 * Pure memory sandbox extractor utility.
 * Fetches the variable on-demand straight out of the active closure space.
 */
const pick = (vaultKey: string): string => {
  const sandbox = secureVault.getAll();
  return sandbox[vaultKey] || "";
};

/**
 * 🚀 THE PERMANENT FIX: A JavaScript Proxy Wrapper Engine.
 * Instead of exporting a static object that can be frozen or cached at boot time,
 * this Proxy intercepts every property access at RUNTIME.
 * 
 * When an endpoint function calls `envs.CHATTERLOOP_API`, the Proxy instantly 
 * executes the 'get' trap, routing the lookup directly to your populated secureVault.
 */
const envs = new Proxy({} as EnvSchema, {
  get: (_target, prop: string) => {
    // Maps your clean internal variable references onto your secure vault server prefixes
    switch (prop) {
      case "GOOGLE_CLIENT_ID":
        return pick("VITE_PUBLIC_GOOGLE_CLIENT_ID");
      case "CHATTERLOOP_API":
        return pick("VITE_PUBLIC_CHATTERLOOP_API");
      case "USER_SERVICE_API":
        return pick("VITE_PUBLIC_CHATTERLOOP_USER_SERVICE_API");
      case "SECRET":
        return pick("VITE_SECRET_JWT_SECRET");
      case "OPEN_ROUTE_API":
        return pick("VITE_PUBLIC_OPEN_ROUTE_API");
      case "OPEN_ROUTE_API_KEY":
        return pick("VITE_SECRET_OPEN_ROUTE_API_KEY");
      case "TURN_SERVER_URL":
        return pick("VITE_PUBLIC_TURN_SERVER_URL");
      case "TURN_SERVER_USERNAME":
        return pick("VITE_SECRET_TURN_SERVER_USERNAME");
      case "TURN_SERVER_CREDENTIAL":
        return pick("VITE_SECRET_TURN_SERVER_CREDENTIAL");
      case "APP_VERSION":
        return pick("VITE_PUBLIC_APP_VERSION") || "dev";
      default:
        return pick(prop);
    }
  }
});

export default envs;
