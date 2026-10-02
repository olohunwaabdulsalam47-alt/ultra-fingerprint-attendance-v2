import { useEffect, useState } from "react";
import type { Attendance } from "../../../domain/entities/attendance";
import {
  getAttendance,
} from "../../../data/repositories/attendanceRepository";

export default function ReportsPage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [error, setError] = useState("");

  async function loadReport() {
    try {
      const savedRecords = await getAttendance();
      setRecords(savedRecords);
      setError("");
    } catch {
      setError("Unable to load attendance report.");
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  const presentCount = records.filter(
    (record) => record.status === "Present",
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "Absent",
  ).length;

  const lateCount = records.filter(
    (record) => record.status === "Late",
  ).length;

  const excusedCount = records.filter(
    (record) => record.status === "Excused",
  ).length;

  return (
    <section>
      <h2>Attendance Reports</h2>

      {error && <p role="alert">{error}</p>}

      <div>
        <h3>Attendance Summary</h3>

        <ul>
          <li>Total Records: {records.length}</li>
          <li>Present: {presentCount}</li>
          <li>Absent: {absentCount}</li>
          <li>Late: {lateCount}</li>
          <li>Excused: {excusedCount}</li>
        </ul>
      </div>

      <h3>Attendance Records</h3>

      {records.length === 0 ? (
        <p>No attendance records available.</p>
      ) : (
        <ul>
          {records.map((record) => (
            <li key={record.attendanceId}>
              {record.date} — Student:{" "}
              {record.studentId} — Status:{" "}
              {record.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
