import type { Attendance } from "../../domain/entities/attendance";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "attendance";

export async function saveAttendance(
  attendance: Attendance,
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
      attendance,
      attendance.attendanceId,
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

export async function getAttendance(): Promise<
  Attendance[]
> {
  const db = await openDatabase();

  const records =
    await new Promise<Attendance[]>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store =
          transaction.objectStore(
            STORE_NAME,
          );

        const request = store.getAll();

        request.onsuccess = () =>
          resolve(
            request.result as Attendance[],
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return records;
}

export async function getAttendanceById(
  attendanceId: string,
): Promise<Attendance | null> {
  const db = await openDatabase();

  const record =
    await new Promise<Attendance | null>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store =
          transaction.objectStore(
            STORE_NAME,
          );

        const request =
          store.get(attendanceId);

        request.onsuccess = () =>
          resolve(
            (request.result as
              | Attendance
              | undefined) ?? null,
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return record;
}

export async function getAttendanceByIdForSchool(
  attendanceId: string,
  schoolId: string,
): Promise<Attendance | null> {
  const selectedSchoolId = schoolId.trim();

  if (!selectedSchoolId) {
    return null;
  }

  const record =
    await getAttendanceById(
      attendanceId,
    );

  if (!record) {
    return null;
  }

  if (record.schoolId !== selectedSchoolId) {
    return null;
  }

  return record;
}

export async function getAttendanceBySchool(
  schoolId: string,
): Promise<Attendance[]> {
  const selectedSchoolId = schoolId.trim();

  if (!selectedSchoolId) {
    return [];
  }

  const records =
    await getAttendance();

  return records.filter(
    (record) =>
      record.schoolId === selectedSchoolId,
  );
}

export async function getAttendanceByDate(
  date: string,
): Promise<Attendance[]> {
  const records =
    await getAttendance();

  return records.filter(
    (record) =>
      record.date === date,
  );
}

export async function getAttendanceBySchoolAndDate(
  schoolId: string,
  date: string,
): Promise<Attendance[]> {
  const selectedSchoolId = schoolId.trim();

  if (!selectedSchoolId) {
    return [];
  }

  const records =
    await getAttendanceBySchool(
      selectedSchoolId,
    );

  return records.filter(
    (record) =>
      record.date === date,
  );
}
