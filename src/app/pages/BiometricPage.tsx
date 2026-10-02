import { useState } from "react";

export default function BiometricPage() {
  const [message, setMessage] = useState("");

  function checkBiometricSupport() {
    if (
      "PublicKeyCredential" in window &&
      typeof navigator.credentials?.create === "function"
    ) {
      setMessage(
        "Biometric/WebAuthn is supported by this browser.",
      );
      return;
    }

    setMessage(
      "Biometric/WebAuthn is not supported by this browser.",
    );
  }

  return (
    <section>
      <h2>Biometric Management</h2>

      <p>
        Configure fingerprint or other supported biometric
        authentication for staff accounts.
      </p>

      <button
        type="button"
        onClick={checkBiometricSupport}
      >
        Check Biometric Support
      </button>

      {message && <p role="status">{message}</p>}
    </section>
  );
}
