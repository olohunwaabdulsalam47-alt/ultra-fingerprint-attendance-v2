import {
  DATABASE_NAME,
  DATABASE_VERSION,
  STORE_NAMES,
} from "./database";

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      for (const storeName of Object.values(
        STORE_NAMES,
      )) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = () => {
      reject(
        new Error(
          "Database opening was blocked.",
        ),
      );
    };
  });
}
