import type { SchoolClass } from "../../domain/entities/class";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "classes";

export async function saveClass(
  schoolClass: SchoolClass,
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
      schoolClass,
      schoolClass.classId,
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

export async function getClasses(): Promise<
  SchoolClass[]
> {
  const db = await openDatabase();

  const classes = await new Promise<
    SchoolClass[]
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
        request.result as SchoolClass[],
      );

    request.onerror = () =>
      reject(request.error);
  });

  db.close();

  return classes;
}

export async function getClassesBySchool(
  schoolId: string,
): Promise<SchoolClass[]> {
  const classes = await getClasses();

  return classes.filter(
    (schoolClass) =>
      schoolClass.schoolId === schoolId &&
      schoolClass.status === "active",
  );
}

export async function getClassById(
  classId: string,
): Promise<SchoolClass | null> {
  const db = await openDatabase();

  const schoolClass =
    await new Promise<SchoolClass | null>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store =
          transaction.objectStore(STORE_NAME);

        const request = store.get(classId);

        request.onsuccess = () =>
          resolve(
            (request.result as
              | SchoolClass
              | undefined) ?? null,
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return schoolClass;
}

export async function getClassByIdForSchool(
  classId: string,
  schoolId: string,
): Promise<SchoolClass | null> {
  const schoolClass =
    await getClassById(classId);

  if (!schoolClass) {
    return null;
  }

  if (schoolClass.schoolId !== schoolId) {
    return null;
  }

  return schoolClass;
}
