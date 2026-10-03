import { useMemo } from "react";
import "./PrincipalDashboardPage.css";

interface MetricCard {
  label: string;
  value: string;
  description: string;
}

interface ActivityItem {
  title: string;
  description: string;
  time: string;
}

const activities: ActivityItem[] = [
  {
    title: "School workspace ready",
    description: "Principal administration environment is available.",
    time: "Today",
  },
  {
    title: "Attendance monitoring",
    description: "Daily attendance can be reviewed from the attendance module.",
    time: "Today",
  },
  {
    title: "School records",
    description: "Classes and student records are managed inside the school.",
    time: "Today",
  },
];

export default function PrincipalDashboardPage() {
  const metrics = useMemo<MetricCard[]>(
    () => [
      {
        label: "Students",
        value: "0",
        description: "Students currently registered in this school.",
      },
      {
        label: "Classes",
        value: "0",
        description: "Active classes configured for this school.",
      },
      {
        label: "Teachers",
        value: "0",
        description: "Teaching staff connected to this school.",
      },
      {
        label: "Today Attendance",
        value: "0%",
        description: "Current attendance completion for today.",
      },
    ],
    [],
  );

  return (
    <main className="principal-dashboard">
      <header className="principal-dashboard-header">
        <div>
          <p className="principal-eyebrow">SCHOOL ADMINISTRATION</p>
          <h1>Principal Workspace</h1>
          <p>
            Manage your school, monitor attendance, and oversee school
            operations from one secure workspace.
          </p>
        </div>

        <div className="principal-status">
          <span className="status-dot" />
          School Workspace Active
        </div>
      </header>

      <section className="principal-metric-grid">
        {metrics.map((metric) => (
          <article className="principal-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.description}</p>
          </article>
        ))}
      </section>

      <section className="principal-content-grid">
        <article className="principal-panel">
          <div className="principal-panel-header">
            <div>
              <h2>School Administration</h2>
              <p>Core areas available to the school principal.</p>
            </div>
          </div>

          <div className="principal-admin-grid">
            <div className="principal-admin-item">
              <strong>School Profile</strong>
              <span>School information and identity</span>
            </div>

            <div className="principal-admin-item">
              <strong>Classes</strong>
              <span>Manage school classes</span>
            </div>

            <div className="principal-admin-item">
              <strong>Students</strong>
              <span>Manage student records</span>
            </div>

            <div className="principal-admin-item">
              <strong>Teachers & Staff</strong>
              <span>Manage school personnel</span>
            </div>

            <div className="principal-admin-item">
              <strong>Attendance</strong>
              <span>Monitor daily attendance</span>
            </div>

            <div className="principal-admin-item">
              <strong>Reports</strong>
              <span>Review school performance records</span>
            </div>
          </div>
        </article>

        <article className="principal-panel">
          <div className="principal-panel-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest school workspace activity.</p>
            </div>
          </div>

          <div className="principal-activity-list">
            {activities.map((activity) => (
              <div className="principal-activity-item" key={activity.title}>
                <div className="activity-marker" />

                <div>
                  <strong>{activity.title}</strong>
                  <p>{activity.description}</p>
                  <small>{activity.time}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="principal-notice">
        <div>
          <strong>School data boundary</strong>
          <p>
            This workspace is intended for the selected school. School
            administrators manage their own students, classes, staff, and
            attendance records without accessing another school&apos;s
            operational data.
          </p>
        </div>
      </section>
    </main>
  );
}
