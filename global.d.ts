// src/types/global.d.ts

export interface EncryptedPackage {
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface BootstrapConfig {
  key: string;
  public: {
    [key: string]: string | undefined;
  };
  payload: EncryptedPackage;
}

declare global {
  interface Window {
    _bootstrap?: BootstrapConfig;
  }
}

// Essential tag to ensure TypeScript reads this as an ambient module layout descriptor
export {};
