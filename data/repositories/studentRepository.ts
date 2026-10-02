import type { Student } from "../../domain/entities/student";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "students";

export async function saveStudent(
  student: Student,
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
      student,
      student.studentId,
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

export async function getStudents(): Promise<Student[]> {
  const db = await openDatabase();

  const students = await new Promise<Student[]>(
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
          request.result as Student[],
        );

      request.onerror = () =>
        reject(request.error);
    },
  );

  db.close();

  return students;
}
