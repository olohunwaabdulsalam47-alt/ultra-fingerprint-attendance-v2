import type { Guardian } from "../../domain/entities/guardian";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "guardians";

export async function saveGuardian(
  guardian: Guardian,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(STORE_NAME);

    store.put(guardian, guardian.guardianId);

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

export async function getGuardians(): Promise<Guardian[]> {
  const db = await openDatabase();

  const guardians = await new Promise<Guardian[]>(
    (resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME,
        "readonly",
      );

      const store = transaction.objectStore(STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () =>
        resolve(request.result as Guardian[]);

      request.onerror = () =>
        reject(request.error);
    },
  );

  db.close();

  return guardians;
}

export async function getGuardiansByStudent(
  studentId: string,
): Promise<Guardian[]> {
  const guardians = await getGuardians();

  return guardians.filter(
    (guardian) =>
      guardian.studentId === studentId &&
      guardian.status === "active",
  );
}

export async function getGuardiansBySchool(
  schoolId: string,
): Promise<Guardian[]> {
  const guardians = await getGuardians();

  return guardians.filter(
    (guardian) =>
      guardian.schoolId === schoolId,
  );
}
