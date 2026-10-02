import type { User } from "../../domain/entities/user";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "users";

export async function saveUser(user: User): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(STORE_NAME);

    store.put(user, user.userId);

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

export async function getUsers(): Promise<User[]> {
  const db = await openDatabase();

  const users = await new Promise<User[]>(
    (resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME,
        "readonly",
      );

      const store = transaction.objectStore(STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () =>
        resolve(request.result as User[]);

      request.onerror = () => reject(request.error);
    },
  );

  db.close();

  return users;
}
