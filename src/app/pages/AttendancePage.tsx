import { useEffect, useState } from "react";
import type { Attendance } from "../../../domain/entities/attendance";
import {
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "../../../domain/enums/attendanceStatus";
import { isValidAttendance } from "../../../domain/validation/entityValidation";
import {
  getAttendance,
  saveAttendance,
} from "../../../data/repositories/attendanceRepository";

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>(
    ATTENDANCE_STATUSES.PRESENT,
  );
  const [error, setError] = useState("");

  async function loadAttendance() {
    try {
      const savedRecords = await getAttendance();
      setRecords(savedRecords);
      setError("");
    } catch {
      setError("Unable to load attendance records.");
    }
  }

  useEffect(() => {
    void loadAttendance();
  }, []);

  async function handleRecordAttendance() {
    const selectedSchoolId = schoolId.trim();
    const selectedClassId = classId.trim();
    const selectedStudentId = studentId.trim();

    if (!selectedSchoolId) {
      setError("School ID is required.");
      return;
    }

    if (!selectedClassId) {
      setError("Class ID is required.");
      return;
    }

    if (!selectedStudentId) {
      setError("Student ID is required.");
      return;
    }

    const now = new Date().toISOString();

    const attendance: Attendance = {
      attendanceId: crypto.randomUUID(),
      schoolId: selectedSchoolId,
      classId: selectedClassId,
      studentId: selectedStudentId,
      date: new Date().toISOString().slice(0, 10),
      status,
      createdAt: now,
      updatedAt: now,
      createdBy: "current-user",
    };

    if (!isValidAttendance(attendance)) {
      setError("Invalid attendance data.");
      return;
    }

    try {
      await saveAttendance(attendance);

      setSchoolId("");
      setClassId("");
      setStudentId("");
      setStatus(ATTENDANCE_STATUSES.PRESENT);

      await loadAttendance();
    } catch {
      setError("Unable to save attendance.");
    }
  }

  return (
    <section>
      <h2>Attendance Management</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleRecordAttendance();
        }}
      >
        <label>
          School ID
          <input
            type="text"
            value={schoolId}
            onChange={(event) =>
              setSchoolId(event.target.value)
            }
            placeholder="Enter School ID"
            required
          />
        </label>

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
            {Object.values(ATTENDANCE_STATUSES).map(
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

      {error && <p role="alert">{error}</p>}

      <h3>Attendance Records</h3>

      {records.length === 0 ? (
        <p>No attendance records have been added yet.</p>
      ) : (
        <ul>
          {records.map((record) => (
            <li key={record.attendanceId}>
              {record.date} — Student:{" "}
              {record.studentId} —{" "}
              {record.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
