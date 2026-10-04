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

export async function getStudentsBySchool(
  schoolId: string,
): Promise<Student[]> {
  const students = await getStudents();

  return students.filter(
    (student) =>
      student.schoolId === schoolId &&
      student.status === "active",
  );
}

export async function getStudentById(
  studentId: string,
): Promise<Student | null> {
  const db = await openDatabase();

  const student =
    await new Promise<Student | null>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store =
          transaction.objectStore(STORE_NAME);

        const request = store.get(studentId);

        request.onsuccess = () =>
          resolve(
            (request.result as
              | Student
              | undefined) ?? null,
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return student;
}

export async function getStudentByIdForSchool(
  studentId: string,
  schoolId: string,
): Promise<Student | null> {
  const student =
    await getStudentById(studentId);

  if (!student) {
    return null;
  }

  if (student.schoolId !== schoolId) {
    return null;
  }

  return student;
}
