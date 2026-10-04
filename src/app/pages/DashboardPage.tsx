import {
  useEffect,
  useState,
} from "react";

import { getSchools } from "../../../data/repositories/schoolRepository";
import { getStudents } from "../../../data/repositories/studentRepository";
import { getAttendance } from "../../../data/repositories/attendanceRepository";
import { getAuthSession } from "../auth/authSession";
import "./DashboardPage.css";

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

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          schools,
          students,
          attendance,
        ] = await Promise.all([
          getSchools(),
          getStudents(),
          getAttendance(),
        ]);

        const today = new Date()
          .toISOString()
          .slice(0, 10);

        const visibleAttendance =
          attendance.filter(
            (record) => record.date === today,
          );

        setStats({
          schools: schools.length,
          students: students.length,
          attendanceToday:
            visibleAttendance.length,
        });
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

  const session = getAuthSession();

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="dashboard-brand-badge">
            UFA
          </div>

          <div>
            <p className="dashboard-eyebrow">
              SCHOOL MANAGEMENT PORTAL
            </p>

            <h1>
              ULTRA FINGERPRINT
              <span> ATTENDANCE</span>
            </h1>

            <p className="dashboard-welcome">
              Welcome back,{" "}
              <strong>
                {session?.name ?? "User"}
              </strong>
            </p>

            <div className="dashboard-role">
              <span className="dashboard-role-dot" />
              {session?.role ?? "Unknown"}
            </div>
          </div>
        </div>

        <div className="dashboard-hero-decoration">
          <div className="dashboard-ring dashboard-ring-one" />
          <div className="dashboard-ring dashboard-ring-two" />
          <div className="dashboard-ring dashboard-ring-three" />
        </div>
      </section>

      {error && (
        <div
          className="dashboard-error"
          role="alert"
        >
          <strong>Dashboard Error</strong>
          <span>{error}</span>
        </div>
      )}

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            🏫
          </div>

          <div className="dashboard-stat-content">
            <p>Schools</p>
            <strong>{stats.schools}</strong>
            <span>Registered schools</span>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            👨‍🎓
          </div>

          <div className="dashboard-stat-content">
            <p>Students</p>
            <strong>{stats.students}</strong>
            <span>Student records</span>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            ✓
          </div>

          <div className="dashboard-stat-content">
            <p>Today's Attendance</p>
            <strong>
              {stats.attendanceToday}
            </strong>
            <span>Attendance records today</span>
          </div>
        </article>
      </section>

      <section className="dashboard-overview">
        <div className="dashboard-section-heading">
          <div>
            <p className="dashboard-section-eyebrow">
              PLATFORM STATUS
            </p>

            <h2>System Overview</h2>
          </div>

          <span className="dashboard-status">
            <span />
            Connected
          </span>
        </div>

        <p className="dashboard-overview-text">
          Attendance, school data, student
          records and security services are
          connected to the application data
          layer.
        </p>

        <div className="dashboard-services">
          <div className="dashboard-service">
            <span className="dashboard-service-check">
              ✓
            </span>

            <div>
              <strong>Attendance System</strong>
              <p>Operational</p>
            </div>
          </div>

          <div className="dashboard-service">
            <span className="dashboard-service-check">
              ✓
            </span>

            <div>
              <strong>Student Records</strong>
              <p>Operational</p>
            </div>
          </div>

          <div className="dashboard-service">
            <span className="dashboard-service-check">
              ✓
            </span>

            <div>
              <strong>Security Services</strong>
              <p>Protected</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>
          ULTRA FINGERPRINT ATTENDANCE
        </span>

        <span>
          Secure School Management Platform
        </span>
      </footer>
    </main>
  );
}
