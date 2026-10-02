import type { PasswordCredential } from "../../domain/entities/passwordCredential";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "configuration";

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function hashPassword(
  password: string,
  salt: Uint8Array,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return toBase64(new Uint8Array(derivedBits));
}

export async function createPasswordCredential(
  userId: string,
  password: string,
): Promise<PasswordCredential> {
  if (!password) {
    throw new Error("Password is required.");
  }

  const salt = crypto.getRandomValues(
    new Uint8Array(16),
  );

  const passwordHash = await hashPassword(
    password,
    salt,
  );

  const now = new Date().toISOString();

  return {
    userId,
    salt: toBase64(salt),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
}

export async function savePasswordCredential(
  credential: PasswordCredential,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(STORE_NAME);

    store.put(
      credential,
      `password:${credential.userId}`,
    );

    transaction.oncomplete = () => resolve();

    transaction.onerror = () => reject(transaction.error);

    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error("Transaction aborted"),
      );
  });

  db.close();
}

export async function getPasswordCredential(
  userId: string,
): Promise<PasswordCredential | null> {
  const db = await openDatabase();

  const credential =
    await new Promise<PasswordCredential | null>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store = transaction.objectStore(
          STORE_NAME,
        );

        const request = store.get(
          `password:${userId}`,
        );

        request.onsuccess = () => {
          resolve(
            (request.result as
              | PasswordCredential
              | undefined) ?? null,
          );
        };

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return credential;
}

export async function verifyPassword(
  password: string,
  credential: PasswordCredential,
): Promise<boolean> {
  const salt = fromBase64(credential.salt);

  const passwordHash = await hashPassword(
    password,
    salt,
  );

  return passwordHash === credential.passwordHash;
}
