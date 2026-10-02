import type { School } from "../../domain/entities/school";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "schools";

export async function saveSchool(
  school: School,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(STORE_NAME);

    store.put(school, school.schoolId);

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

export async function getSchools(): Promise<School[]> {
  const db = await openDatabase();

  const schools = await new Promise<School[]>(
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
        resolve(request.result as School[]);

      request.onerror = () =>
        reject(request.error);
    },
  );

  db.close();

  return schools;
}
