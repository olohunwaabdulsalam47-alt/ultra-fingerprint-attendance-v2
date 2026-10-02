import { useState } from "react";
import type { WebAuthnCredential } from "../../../domain/entities/webauthnCredential";
import { saveWebAuthnCredential } from "../../../data/repositories/webauthnCredentialRepository";

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export default function BiometricPage() {
  const [message, setMessage] = useState("");

  async function registerBiometric() {
    setMessage("");

    if (
      !("PublicKeyCredential" in window) ||
      typeof navigator.credentials?.create !== "function"
    ) {
      setMessage(
        "Biometric/WebAuthn is not supported by this browser.",
      );
      return;
    }

    try {
      const credential =
        await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(
              new Uint8Array(32),
            ),
            rp: {
              name: "ULTRA FINGERPRINT ATTENDANCE",
            },
            user: {
              id: crypto.getRandomValues(
                new Uint8Array(16),
              ),
              name: "staff@ultra-attendance.local",
              displayName: "Attendance Staff",
            },
            pubKeyCredParams: [
              {
                type: "public-key",
                alg: -7,
              },
              {
                type: "public-key",
                alg: -257,
              },
            ],
            authenticatorSelection: {
              userVerification: "required",
            },
            timeout: 60000,
          },
        });

      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error(
          "Biometric registration failed.",
        );
      }

      const credentialRecord: WebAuthnCredential = {
        credentialId: toBase64Url(
          credential.rawId,
        ),
        userId: "current-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveWebAuthnCredential(
        credentialRecord,
      );

      setMessage(
        "Biometric credential registered successfully.",
      );
    } catch {
      setMessage(
        "Biometric registration was cancelled or could not be completed.",
      );
    }
  }

  return (
    <section>
      <h2>Biometric Management</h2>

      <p>
        Register a fingerprint or other supported
        WebAuthn biometric credential.
      </p>

      <button
        type="button"
        onClick={() => void registerBiometric()}
      >
        Register Biometric
      </button>

      {message && <p role="status">{message}</p>}
    </section>
  );
}
