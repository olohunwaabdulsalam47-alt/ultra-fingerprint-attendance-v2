import { describe, expect, it } from "vitest";
import type { Attendance } from "../domain/entities/attendance";
import { isValidAttendance } from "../domain/validation/entityValidation";

describe("attendance validation", () => {
  it("accepts a valid attendance record", () => {
    const attendance: Attendance = {
      attendanceId: "attendance-1",
      schoolId: "school-1",
      classId: "class-1",
      studentId: "student-1",
      date: "2026-10-01",
      status: "Present",
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
      createdBy: "user-1",
    };

    expect(isValidAttendance(attendance)).toBe(true);
  });

  it("rejects an invalid attendance status", () => {
    const attendance = {
      attendanceId: "attendance-1",
      schoolId: "school-1",
      classId: "class-1",
      studentId: "student-1",
      date: "2026-10-01",
      status: "Invalid",
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
      createdBy: "user-1",
    } as unknown as Attendance;

    expect(isValidAttendance(attendance)).toBe(false);
  });
});
