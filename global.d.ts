// src/global.d.ts
import { SecureEnvs } from "./src/reusables/hooks/secureVault";

export {};

declare global {
  interface Window {
    _bootstrap?: {
      nonce: string;
      keyHalfA: string;
      public: SecureEnvs;
    };
  }
}
