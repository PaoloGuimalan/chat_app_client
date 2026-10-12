/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/SecureBootContext.tsx
import React, { createContext, useState, useEffect } from "react";
import { secureVault } from "./reusables/hooks/secureVault";
import App from "./App.tsx";

interface BootstrapApiResponse {
  keyHalfB: string;
  payload: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
}

// Low-level Web Crypto API execution logic
async function decryptPayload(
  fullMasterKeyHex: string,
  ivHex: string,
  authTagHex: string,
  ciphertextHex: string
): Promise<any> {
  const toBinary = (hex: string): Uint8Array => {
    const matches = hex.match(/.{1,2}/g);
    if (!matches) throw new Error("Invalid hexadecimal payload alignment mapping.");
    return new Uint8Array(matches.map(b => parseInt(b, 16)));
  };

  const keyBuffer: any = toBinary(fullMasterKeyHex);
  const ivBuffer: any = toBinary(ivHex);
  const authTagBuffer = toBinary(authTagHex);
  const cipherBuffer = toBinary(ciphertextHex);

  const combinedBuffer = new Uint8Array(cipherBuffer.length + authTagBuffer.length);
  combinedBuffer.set(cipherBuffer);
  combinedBuffer.set(authTagBuffer, cipherBuffer.length);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false, // Prevents malicious extensions from exporting this key back out of RAM
    ["decrypt"]
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer, tagLength: 128 },
    cryptoKey,
    combinedBuffer
  );

  return JSON.parse(new TextDecoder().decode(decryptedBuffer));
}

const SecureBootContext = createContext<boolean>(false);

export function SecureBootProvider(): React.JSX.Element {
  const [bootstrapped, setBootstrapped] = useState<boolean>(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    const executeSplitKeyHandshake = async (): Promise<void> => {
      const bootstrap: any = (window as any)._bootstrap;
      
      // If initialization parameters are already spent or missing, block execution
      if (!bootstrap) {
        setBootError("Security initialization parameters missing.");
        return;
      }

      try {
        const baseApiUrl = bootstrap.public.VITE_PUBLIC_CHATTERLOOP_API;
        if (!baseApiUrl) {
          throw new Error("Public base address path missing from server header context.");
        }

        // 1. Submit the nonce and keyHalfA to burn the verification token in Redis instantly
        const response = await fetch(`/api/bootstrap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nonce: bootstrap.nonce,
            keyHalfA: bootstrap.keyHalfA,
          }),
        });

        if (!response.ok) {
          throw new Error("Security verification handshake rejected by cache database.");
        }

        const data: BootstrapApiResponse = await response.json();

        // 2. Reconstitute the full 64-character symmetric AES anchor key inside local execution RAM
        const fullMasterKey = bootstrap.keyHalfA + data.keyHalfB;

        // 3. Decrypt the sensitive configurations natively via hardware acceleration
        const decryptedPackage = await decryptPayload(
          fullMasterKey,
          data.payload.iv,
          data.payload.authTag,
          data.payload.ciphertext
        );

        // 4. Enforce structural time window check
        if (Date.now() > decryptedPackage.exp) {
          throw new Error("Initialization security time window violation.");
        }

        // 5. Transfer configurations safely inside our unreferenced plain-object closure vault
        secureVault.lock(bootstrap.public, decryptedPackage.envs);

        // --- CRITICAL SELF-DESTRUCT SECURE WIPING ---
        // Purge raw object indicators from window space and scrub the template script node from DOM architecture
        delete (window as any)._bootstrap;
        document.getElementById("bootstrap-layer")?.remove();

        setBootstrapped(true);
      } catch (err) {
        console.error("[handshake-err]", err);
        setBootError("Cryptographic environment initialization failed.");
        
        // Ensure clean memory purge even if layout configuration completely crashes
        delete (window as any)._bootstrap;
        document.getElementById("bootstrap-layer")?.remove();
      }
    };

    executeSplitKeyHandshake();
  }, []);

  if (bootError) {
    return (
      <div style={{ backgroundColor: "#0f172a", color: "#ef4444", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: "20px", border: "1px solid #1e293b", borderRadius: "8px", backgroundColor: "#1e293b" }}>
          <h2 style={{ margin: "0 0 10px 0" }}>Security Block</h2>
          <p style={{ color: "#94a3b8", margin: 0 }}>{bootError}</p>
        </div>
      </div>
    );
  }

  if (!bootstrapped) {
    return (
      <div style={{ backgroundColor: "#0f172a", color: "#38bdf8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #1e293b", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px auto" }}></div>
          <p style={{ margin: 0, fontWeight: 500 }}>Assembling Secure Application Sandbox...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <SecureBootContext.Provider value={bootstrapped}>
      <App />
    </SecureBootContext.Provider>
  );
}
