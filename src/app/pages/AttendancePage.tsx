import { useEffect, useState } from "react";
import type { Attendance } from "../../../domain/entities/attendance";
import {
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "../../../domain/enums/attendanceStatus";
import { isValidAttendance } from "../../../domain/validation/entityValidation";
import {
  getAttendanceBySchool,
  saveAttendance,
} from "../../../data/repositories/attendanceRepository";
import {
  getClassByIdForSchool,
} from "../../../data/repositories/classRepository";
import {
  getStudentByIdForSchool,
} from "../../../data/repositories/studentRepository";
import { getAuthSession } from "../auth/authSession";
import { recordAuditEvent } from "../audit/auditService";
import {
  createAttendanceNotificationEvents,
} from "../notifications/attendanceNotificationService";

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>(
    ATTENDANCE_STATUSES.PRESENT,
  );
  const [error, setError] = useState("");
  const [notificationMessage, setNotificationMessage] =
    useState("");

  async function loadAttendance() {
    try {
      const session = getAuthSession();

      if (!session) {
        setRecords([]);
        setError(
          "You must be logged in to view attendance records.",
        );
        return;
      }

      if (!session.schoolId) {
        setRecords([]);
        setError(
          "Your account is not assigned to a school.",
        );
        return;
      }

      const schoolRecords =
        await getAttendanceBySchool(
          session.schoolId,
        );

      setRecords(schoolRecords);
      setError("");
    } catch {
      setError(
        "Unable to load attendance records.",
      );
    }
  }

  useEffect(() => {
    void loadAttendance();
  }, []);

  async function handleRecordAttendance() {
    const selectedClassId = classId.trim();
    const selectedStudentId = studentId.trim();

    setError("");
    setNotificationMessage("");

    if (!selectedClassId) {
      setError("Class ID is required.");
      return;
    }

    if (!selectedStudentId) {
      setError("Student ID is required.");
      return;
    }

    const session = getAuthSession();

    if (!session) {
      setError(
        "You must be logged in to record attendance.",
      );
      return;
    }

    if (!session.schoolId) {
      setError(
        "Your account is not assigned to a school.",
      );
      return;
    }

    const schoolId = session.schoolId;

    try {
      const schoolClass =
        await getClassByIdForSchool(
          selectedClassId,
          schoolId,
        );

      if (!schoolClass) {
        setError(
          "The selected class does not belong to your school.",
        );
        return;
      }

      const student =
        await getStudentByIdForSchool(
          selectedStudentId,
          schoolId,
        );

      if (!student) {
        setError(
          "The selected student does not belong to your school.",
        );
        return;
      }

      if (student.classId !== selectedClassId) {
        setError(
          "The selected student does not belong to the selected class.",
        );
        return;
      }

      const now =
        new Date().toISOString();

      const attendance: Attendance = {
        attendanceId: crypto.randomUUID(),
        schoolId,
        classId: selectedClassId,
        studentId: selectedStudentId,
        date:
          new Date()
            .toISOString()
            .slice(0, 10),
        status,
        createdAt: now,
        updatedAt: now,
        createdBy: session.userId,
      };

      if (!isValidAttendance(attendance)) {
        setError(
          "Invalid attendance data.",
        );
        return;
      }

      await saveAttendance(attendance);

      let notificationCount = 0;

      try {
        const notificationEvents =
          await createAttendanceNotificationEvents(
            attendance.schoolId,
            attendance.studentId,
            student.name,
            attendance.status,
          );

        notificationCount =
          notificationEvents.length;
      } catch {
        // Attendance remains authoritative.
        // Notification creation must not
        // invalidate a successful attendance record.
      }

      await recordAuditEvent(
        session.userId,
        "ATTENDANCE_RECORDED",
        `Recorded ${attendance.status} attendance for student ${student.studentId}.`,
      );

      setClassId("");
      setStudentId("");
      setStatus(
        ATTENDANCE_STATUSES.PRESENT,
      );

      if (notificationCount > 0) {
        setNotificationMessage(
          `Attendance recorded. ${notificationCount} parent/guardian notification event(s) created.`,
        );
      } else {
        setNotificationMessage(
          "Attendance recorded. No parent/guardian notification event was created.",
        );
      }

      await loadAttendance();
    } catch {
      setError(
        "Unable to save attendance.",
      );
    }
  }

  return (
    <section>
      <h2>Attendance Management</h2>

      <p>
        Attendance is automatically recorded under your
        assigned school.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleRecordAttendance();
        }}
      >
        <label>
          Class ID
          <input
            type="text"
            value={classId}
            onChange={(event) =>
              setClassId(event.target.value)
            }
            placeholder="Enter Class ID"
            required
          />
        </label>

        <label>
          Student ID
          <input
            type="text"
            value={studentId}
            onChange={(event) =>
              setStudentId(event.target.value)
            }
            placeholder="Enter Student ID"
            required
          />
        </label>

        <label>
          Attendance Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as AttendanceStatus,
              )
            }
          >
            {Object.values(
              ATTENDANCE_STATUSES,
            ).map(
              (attendanceStatus) => (
                <option
                  key={attendanceStatus}
                  value={attendanceStatus}
                >
                  {attendanceStatus}
                </option>
              ),
            )}
          </select>
        </label>

        <button type="submit">
          Record Attendance
        </button>
      </form>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      {notificationMessage && (
        <p role="status">
          {notificationMessage}
        </p>
      )}

      <h3>Attendance Records</h3>

      {records.length === 0 ? (
        <p>
          No attendance records have been added yet.
        </p>
      ) : (
        <ul>
          {records.map(
            (record) => (
              <li
                key={record.attendanceId}
              >
                {record.date} — Student:{" "}
                {record.studentId} —{" "}
                {record.status}
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
