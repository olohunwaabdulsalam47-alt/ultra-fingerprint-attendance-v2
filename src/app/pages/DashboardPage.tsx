import {
  useEffect,
  useState,
} from "react";

import { getSchools } from "../../../data/repositories/schoolRepository";
import { getStudents } from "../../../data/repositories/studentRepository";
import { getAttendance } from "../../../data/repositories/attendanceRepository";
import { getAuthSession } from "../auth/authSession";

interface DashboardStats {
  schools: number;
  students: number;
  attendanceToday: number;
}

export default function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>({
      schools: 0,
      students: 0,
      attendanceToday: 0,
    });

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const session =
          getAuthSession();

        const [
          schools,
          students,
          attendance,
        ] = await Promise.all([
          getSchools(),
          getStudents(),
          getAttendance(),
        ]);

        const today =
          new Date()
            .toISOString()
            .slice(0, 10);

        const visibleAttendance =
          attendance.filter(
            (record) =>
              record.date === today,
          );

        setStats({
          schools: schools.length,
          students: students.length,
          attendanceToday:
            visibleAttendance.length,
        });

        void session;
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard.",
        );
      }
    }

    void loadDashboard();
  }, []);

  const session =
    getAuthSession();

  return (
    <main
      style={{
        padding: "24px",
      }}
    >
      <header>
        <h1>
          ULTRA FINGERPRINT ATTENDANCE
        </h1>

        <p>
          Welcome,{" "}
          {session?.name ?? "User"}.
        </p>

        <p>
          Role:{" "}
          {session?.role ?? "Unknown"}
        </p>
      </header>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginTop: "24px",
        }}
      >
        <article>
          <h2>Schools</h2>
          <strong>
            {stats.schools}
          </strong>
        </article>

        <article>
          <h2>Students</h2>
          <strong>
            {stats.students}
          </strong>
        </article>

        <article>
          <h2>
            Today's Attendance
          </h2>
          <strong>
            {stats.attendanceToday}
          </strong>
        </article>
      </section>

      <section
        style={{
          marginTop: "32px",
        }}
      >
        <h2>
          System Overview
        </h2>

        <p>
          Attendance, school data,
          student records and security
          services are connected to the
          application data layer.
        </p>
      </section>
    </main>
  );
}
