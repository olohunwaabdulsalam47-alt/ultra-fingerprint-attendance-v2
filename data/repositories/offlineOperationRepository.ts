import type { OfflineOperation } from "../../domain/entities/offlineOperation";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "offlineOperations";

export async function saveOfflineOperation(
  operation: OfflineOperation,
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
      operation,
      operation.operationId,
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

export async function getOfflineOperations(): Promise<
  OfflineOperation[]
> {
  const db = await openDatabase();

  const operations =
    await new Promise<OfflineOperation[]>(
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
            request.result as OfflineOperation[],
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return operations;
}

export async function updateOfflineOperation(
  operation: OfflineOperation,
): Promise<void> {
  await saveOfflineOperation(operation);
}
