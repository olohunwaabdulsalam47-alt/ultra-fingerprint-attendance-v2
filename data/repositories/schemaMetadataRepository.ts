import type { SchemaMetadata } from "../../domain/entities/schemaMetadata";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "schemaMetadata";

export async function saveSchemaMetadata(
  metadata: SchemaMetadata,
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
      metadata,
      metadata.schemaMetadataId,
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

export async function getSchemaMetadata(): Promise<
  SchemaMetadata[]
> {
  const db = await openDatabase();

  const metadata = await new Promise<
    SchemaMetadata[]
  >((resolve, reject) => {
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
        request.result as SchemaMetadata[],
      );

    request.onerror = () =>
      reject(request.error);
  });

  db.close();

  return metadata;
}
