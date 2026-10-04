import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { openDatabase } from "../../../data/db/openDatabase";
import {
  getAttendance,
  getAttendanceByDate,
} from "../../../data/repositories/attendanceRepository";
import { saveAuthSession } from "../auth/authSession";
import { recordAuditEvent } from "../audit/auditService";
import { getAuditEvents } from "../../../data/repositories/auditEventRepository";

async function clearStore(
  storeName: string,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      storeName,
      "readwrite",
    );

    const store =
      transaction.objectStore(storeName);

    store.clear();

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

describe("attendance audit integration", () => {
  beforeEach(async () => {
    await clearStore("attendance");
    await clearStore("auditEvents");
    sessionStorage.clear();
  });

  it("stores attendance with the authenticated user ID", async () => {
    saveAuthSession({
      userId: "teacher-1",
      schoolId: "school-1",
      staffId: "STAFF001",
      name: "Test Teacher",
      role: "Teacher",
      loginMethod: "PASSWORD",
      createdAt: new Date().toISOString(),
    });

    const attendance = {
      attendanceId: crypto.randomUUID(),
      schoolId: "school-1",
      classId: "class-1",
      studentId: "student-1",
      date: "2026-10-02",
      status: "Present" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "teacher-1",
    };

    const { saveAttendance } =
      await import(
        "../../../data/repositories/attendanceRepository"
      );

    await saveAttendance(attendance);

    await recordAuditEvent(
      "teacher-1",
      "ATTENDANCE_RECORDED",
      "Recorded Present attendance for student student-1.",
    );

    const records = await getAttendance();

    expect(records).toHaveLength(1);
    expect(records[0]?.createdBy).toBe(
      "teacher-1",
    );

    const auditEvents = await getAuditEvents();

    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0]?.userId).toBe(
      "teacher-1",
    );
    expect(auditEvents[0]?.action).toBe(
      "ATTENDANCE_RECORDED",
    );
  });

  it("can retrieve attendance by date", async () => {
    const { saveAttendance } =
      await import(
        "../../../data/repositories/attendanceRepository"
      );

    await saveAttendance({
      attendanceId: crypto.randomUUID(),
      schoolId: "school-1",
      classId: "class-1",
      studentId: "student-1",
      date: "2026-10-02",
      status: "Present",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "teacher-1",
    });

    const records =
      await getAttendanceByDate("2026-10-02");

    expect(records).toHaveLength(1);
    expect(records[0]?.date).toBe(
      "2026-10-02",
    );
  });
});
