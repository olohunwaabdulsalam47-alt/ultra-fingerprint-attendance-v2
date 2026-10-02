import type { AuditEvent } from "../../domain/entities/auditEvent";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "auditEvents";

export async function saveAuditEvent(
  event: AuditEvent,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(STORE_NAME);

    store.put(
      event,
      event.auditEventId,
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

export async function getAuditEvents(): Promise<
  AuditEvent[]
> {
  const db = await openDatabase();

  const events = await new Promise<AuditEvent[]>(
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
          request.result as AuditEvent[],
        );

      request.onerror = () =>
        reject(request.error);
    },
  );

  db.close();

  return events;
}
