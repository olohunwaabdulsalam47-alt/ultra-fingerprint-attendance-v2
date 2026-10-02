import type { WebAuthnCredential } from "../../domain/entities/webauthnCredential";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "webauthnCredentials";

export async function saveWebAuthnCredential(
  credential: WebAuthnCredential,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(
      STORE_NAME,
    );

    store.put(
      credential,
      credential.credentialId,
    );

    transaction.oncomplete = () => resolve();

    transaction.onerror = () =>
      reject(transaction.error);

    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error("Transaction aborted"),
      );
  });

  db.close();
}

export async function getWebAuthnCredentials(): Promise<
  WebAuthnCredential[]
> {
  const db = await openDatabase();

  const credentials =
    await new Promise<WebAuthnCredential[]>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store = transaction.objectStore(
          STORE_NAME,
        );

        const request = store.getAll();

        request.onsuccess = () =>
          resolve(
            request.result as WebAuthnCredential[],
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return credentials;
}
