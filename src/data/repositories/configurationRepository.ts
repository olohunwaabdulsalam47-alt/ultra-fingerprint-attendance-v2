import type { Configuration } from "../../domain/entities/configuration";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "configuration";

export async function saveConfiguration(
  configuration: Configuration,
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
      configuration,
      configuration.configurationId,
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

export async function getConfigurations(): Promise<
  Configuration[]
> {
  const db = await openDatabase();

  const configurations =
    await new Promise<Configuration[]>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store =
          transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () =>
          resolve(
            request.result as Configuration[],
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return configurations;
}

export async function getConfigurationByKey(
  key: string,
): Promise<Configuration | null> {
  const configurations =
    await getConfigurations();

  return (
    configurations.find(
      (configuration) =>
        configuration.key === key,
    ) ?? null
  );
}
