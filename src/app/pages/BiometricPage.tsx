import { useState } from "react";
import {
  saveWebAuthnCredential,
} from "../../../data/repositories/webauthnCredentialRepository";
import { getAuthSession } from "../auth/authSession";
import { recordAuditEvent } from "../audit/auditService";

export default function BiometricPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function registerBiometric() {
    setMessage("");
    setError("");

    const session = getAuthSession();

    if (!session) {
      setError("You must be logged in.");
      return;
    }

    if (!window.PublicKeyCredential) {
      setError(
        "Biometric authentication is not supported on this device.",
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
              id: new TextEncoder().encode(
                session.userId,
              ),
              name: session.staffId,
              displayName: session.name,
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
              authenticatorAttachment:
                "platform",
              userVerification: "required",
            },
            timeout: 60000,
            attestation: "none",
          },
        });

      if (!credential) {
        setError(
          "Biometric registration was cancelled.",
        );
        return;
      }

      const publicKeyCredential =
        credential as PublicKeyCredential;

      const response =
        publicKeyCredential.response as AuthenticatorAttestationResponse;

      const storedCredential = {
        credentialId: Array.from(
          new Uint8Array(
            publicKeyCredential.rawId,
          ),
        )
          .map((byte) =>
            byte.toString(16).padStart(2, "0"),
          )
          .join(""),
        userId: session.userId,
        publicKey: Array.from(
          new Uint8Array(
            response.getPublicKey() ?? new ArrayBuffer(0),
          ),
        )
          .map((byte) =>
            byte.toString(16).padStart(2, "0"),
          )
          .join(""),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveWebAuthnCredential(
        storedCredential,
      );

      await recordAuditEvent(
        session.userId,
        "BIOMETRIC_REGISTERED",
        `Registered a biometric credential for ${session.name}.`,
      );

      setMessage(
        "Biometric credential registered successfully.",
      );
    } catch {
      setError(
        "Biometric registration failed or was cancelled.",
      );
    }
  }

  return (
    <section>
      <h2>Biometric Authentication</h2>

      <p>
        Register this device's supported biometric
        authenticator for your account.
      </p>

      <button
        type="button"
        onClick={() => {
          void registerBiometric();
        }}
      >
        Register Biometric
      </button>

      {message && <p>{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
