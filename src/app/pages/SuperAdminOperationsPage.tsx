import {
  useMemo,
  useState,
} from "react";
import "./SuperAdminOperationsPage.css";

type SystemStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "MAINTENANCE";

type TaskStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  status: TaskStatus;
  lastRun: string;
  nextRun: string;
}

interface BackupRecord {
  id: string;
  type: "FULL" | "CONFIGURATION" | "DATABASE";
  status: "COMPLETED" | "RUNNING" | "FAILED";
  createdAt: string;
  size: string;
}

const FEATURE_FLAGS_KEY =
  "ultra-platform-feature-flags";

const TASKS_KEY =
  "ultra-platform-scheduled-tasks";

const BACKUPS_KEY =
  "ultra-platform-backups";

const MAINTENANCE_KEY =
  "ultra-platform-maintenance-mode";

const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: "attendance",
    name: "Attendance Module",
    description:
      "Controls access to the core attendance platform.",
    enabled: true,
  },
  {
    id: "biometric",
    name: "Biometric Attendance",
    description:
      "Controls biometric attendance capabilities.",
    enabled: true,
  },
  {
    id: "offline",
    name: "Offline Attendance",
    description:
      "Allows supported clients to continue attendance while offline.",
    enabled: true,
  },
  {
    id: "public-registration",
    name: "Public School Registration",
    description:
      "Allows new schools to submit applications.",
    enabled: true,
  },
  {
    id: "platform-notifications",
    name: "Platform Notifications",
    description:
      "Controls platform-wide notification delivery.",
    enabled: true,
  },
  {
    id: "maintenance-banner",
    name: "Maintenance Banner",
    description:
      "Displays operational notices to platform users.",
    enabled: true,
  },
];

const DEFAULT_TASKS: ScheduledTask[] = [
  {
    id: "daily-backup",
    name: "Daily Platform Backup",
    description:
      "Creates a scheduled platform backup.",
    schedule: "Every day at 02:00",
    status: "ACTIVE",
    lastRun: "Not yet run",
    nextRun: "Next scheduled cycle",
  },
  {
    id: "audit-cleanup",
    name: "Audit Log Maintenance",
    description:
      "Processes eligible audit records according to retention settings.",
    schedule: "Every Sunday at 03:00",
    status: "ACTIVE",
    lastRun: "Not yet run",
    nextRun: "Next scheduled cycle",
  },
  {
    id: "system-health",
    name: "System Health Check",
    description:
      "Runs periodic platform health checks.",
    schedule: "Every 15 minutes",
    status: "ACTIVE",
    lastRun: "Not yet run",
    nextRun: "Next scheduled cycle",
  },
];

function loadFeatureFlags(): FeatureFlag[] {
  try {
    const value = localStorage.getItem(
      FEATURE_FLAGS_KEY,
    );

    if (!value) {
      return DEFAULT_FEATURE_FLAGS;
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : DEFAULT_FEATURE_FLAGS;
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}

function saveFeatureFlags(
  flags: FeatureFlag[],
) {
  localStorage.setItem(
    FEATURE_FLAGS_KEY,
    JSON.stringify(flags),
  );
}

function loadTasks(): ScheduledTask[] {
  try {
    const value = localStorage.getItem(
      TASKS_KEY,
    );

    if (!value) {
      return DEFAULT_TASKS;
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

function saveTasks(
  tasks: ScheduledTask[],
) {
  localStorage.setItem(
    TASKS_KEY,
    JSON.stringify(tasks),
  );
}

function loadBackups(): BackupRecord[] {
  try {
    const value = localStorage.getItem(
      BACKUPS_KEY,
    );

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveBackups(
  backups: BackupRecord[],
) {
  localStorage.setItem(
    BACKUPS_KEY,
    JSON.stringify(backups),
  );
}

function loadMaintenanceMode() {
  return (
    localStorage.getItem(
      MAINTENANCE_KEY,
    ) === "true"
  );
}

function saveMaintenanceMode(
  enabled: boolean,
) {
  localStorage.setItem(
    MAINTENANCE_KEY,
    String(enabled),
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function taskClass(
  status: TaskStatus,
) {
  return `operations-task-status operations-task-${status.toLowerCase()}`;
}

export default function SuperAdminOperationsPage() {
  const [systemStatus, setSystemStatus] =
    useState<SystemStatus>(
      loadMaintenanceMode()
        ? "MAINTENANCE"
        : "OPERATIONAL",
    );

  const [featureFlags, setFeatureFlags] =
    useState<FeatureFlag[]>(
      loadFeatureFlags,
    );

  const [tasks, setTasks] =
    useState<ScheduledTask[]>(
      loadTasks,
    );

  const [backups, setBackups] =
    useState<BackupRecord[]>(
      loadBackups,
    );

  const [message, setMessage] =
    useState("");

  const enabledFeatures = useMemo(
    () =>
      featureFlags.filter(
        (item) => item.enabled,
      ).length,
    [featureFlags],
  );

  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (item) => item.status === "ACTIVE",
      ).length,
    [tasks],
  );

  const completedBackups = useMemo(
    () =>
      backups.filter(
        (item) =>
          item.status === "COMPLETED",
      ).length,
    [backups],
  );

  function showMessage(
    text: string,
  ) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function toggleMaintenance() {
    const next =
      systemStatus === "MAINTENANCE"
        ? "OPERATIONAL"
        : "MAINTENANCE";

    setSystemStatus(next);
    saveMaintenanceMode(
      next === "MAINTENANCE",
    );

    showMessage(
      next === "MAINTENANCE"
        ? "Maintenance mode enabled."
        : "Maintenance mode disabled.",
    );
  }

  function toggleFeature(
    id: string,
  ) {
    const next = featureFlags.map(
      (flag) =>
        flag.id === id
          ? {
              ...flag,
              enabled: !flag.enabled,
            }
          : flag,
    );

    setFeatureFlags(next);
    saveFeatureFlags(next);

    const changed = next.find(
      (flag) => flag.id === id,
    );

    if (changed) {
      showMessage(
        `${changed.name} ${
          changed.enabled
            ? "enabled"
            : "disabled"
        }.`,
      );
    }
  }

  function setTaskStatus(
    id: string,
    status: TaskStatus,
  ) {
    const next = tasks.map(
      (task) =>
        task.id === id
          ? {
              ...task,
              status,
            }
          : task,
    );

    setTasks(next);
    saveTasks(next);

    showMessage(
      "Scheduled task status updated.",
    );
  }

  function createBackup(
    type: BackupRecord["type"],
  ) {
    const now = new Date().toISOString();

    const backup: BackupRecord = {
      id: `BKP-${Date.now()}`,
      type,
      status: "COMPLETED",
      createdAt: now,
      size:
        type === "FULL"
          ? "Development snapshot"
          : "Configuration snapshot",
    };

    const next = [
      backup,
      ...backups,
    ];

    setBackups(next);
    saveBackups(next);

    showMessage(
      `${type} backup record created.`,
    );
  }

  function resetFeatureFlags() {
    const confirmed =
      window.confirm(
        "Reset all feature flags to their default configuration?",
      );

    if (!confirmed) {
      return;
    }

    setFeatureFlags(
      DEFAULT_FEATURE_FLAGS,
    );

    saveFeatureFlags(
      DEFAULT_FEATURE_FLAGS,
    );

    showMessage(
      "Feature flags reset.",
    );
  }

  return (
    <main className="operations-page">
      <section className="operations-header">
        <div>
          <span className="operations-eyebrow">
            SUPER ADMIN
          </span>

          <h1>
            System Maintenance & Operations
          </h1>

          <p>
            Monitor platform operations and
            control core system configuration.
          </p>
        </div>

        <button
          type="button"
          className={
            systemStatus === "MAINTENANCE"
              ? "operations-button operations-button-success"
              : "operations-button operations-button-warning"
          }
          onClick={toggleMaintenance}
        >
          {systemStatus ===
          "MAINTENANCE"
            ? "Disable Maintenance"
            : "Enable Maintenance"}
        </button>
      </section>

      {message && (
        <div className="operations-message">
          {message}
        </div>
      )}

      <section className="operations-status-card">
        <div>
          <span className="operations-eyebrow">
            PLATFORM STATUS
          </span>

          <h2>
            {systemStatus ===
            "OPERATIONAL"
              ? "System Operational"
              : systemStatus ===
                  "MAINTENANCE"
                ? "Maintenance Mode Active"
                : "System Degraded"}
          </h2>

          <p>
            Platform operational controls
            are available from this center.
          </p>
        </div>

        <span
          className={`operations-status operations-status-${systemStatus.toLowerCase()}`}
        >
          {systemStatus}
        </span>
      </section>

      <section className="operations-stats">
        <article>
          <span>Enabled Features</span>
          <strong>
            {enabledFeatures}
          </strong>
        </article>

        <article>
          <span>Active Tasks</span>
          <strong>
            {activeTasks}
          </strong>
        </article>

        <article>
          <span>Backup Records</span>
          <strong>
            {completedBackups}
          </strong>
        </article>

        <article>
          <span>System Status</span>
          <strong>
            {systemStatus ===
            "OPERATIONAL"
              ? "OK"
              : "ATTENTION"}
          </strong>
        </article>
      </section>

      <section className="operations-grid">
        <article className="operations-card">
          <div className="operations-card-header">
            <div>
              <h2>
                Feature Flags
              </h2>
              <p>
                Enable or disable platform
                capabilities.
              </p>
            </div>

            <button
              type="button"
              className="operations-small-button"
              onClick={resetFeatureFlags}
            >
              Reset
            </button>
          </div>

          <div className="operations-feature-list">
            {featureFlags.map(
              (feature) => (
                <div
                  className="operations-feature"
                  key={feature.id}
                >
                  <div>
                    <strong>
                      {feature.name}
                    </strong>

                    <p>
                      {
                        feature.description
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    className={
                      feature.enabled
                        ? "operations-toggle operations-toggle-on"
                        : "operations-toggle"
                    }
                    onClick={() =>
                      toggleFeature(
                        feature.id,
                      )
                    }
                    aria-label={`Toggle ${feature.name}`}
                  >
                    <span />
                  </button>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="operations-card">
          <div className="operations-card-header">
            <div>
              <h2>
                Platform Configuration
              </h2>
              <p>
                Current operational settings.
              </p>
            </div>
          </div>

          <div className="operations-config-list">
            <div>
              <span>
                Maintenance Mode
              </span>

              <strong>
                {systemStatus ===
                "MAINTENANCE"
                  ? "Enabled"
                  : "Disabled"}
              </strong>
            </div>

            <div>
              <span>
                Public Registration
              </span>

              <strong>
                {
                  featureFlags.find(
                    (item) =>
                      item.id ===
                      "public-registration",
                  )?.enabled
                    ? "Enabled"
                    : "Disabled"
                }
              </strong>
            </div>

            <div>
              <span>
                Biometric Module
              </span>

              <strong>
                {
                  featureFlags.find(
                    (item) =>
                      item.id ===
                      "biometric",
                  )?.enabled
                    ? "Enabled"
                    : "Disabled"
                }
              </strong>
            </div>

            <div>
              <span>
                Offline Attendance
              </span>

              <strong>
                {
                  featureFlags.find(
                    (item) =>
                      item.id ===
                      "offline",
                  )?.enabled
                    ? "Enabled"
                    : "Disabled"
                }
              </strong>
            </div>

            <div>
              <span>
                Platform Notifications
              </span>

              <strong>
                {
                  featureFlags.find(
                    (item) =>
                      item.id ===
                      "platform-notifications",
                  )?.enabled
                    ? "Enabled"
                    : "Disabled"
                }
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="operations-card operations-tasks-card">
        <div className="operations-card-header">
          <div>
            <h2>
              Scheduled Tasks
            </h2>

            <p>
              Manage recurring platform
              maintenance tasks.
            </p>
          </div>
        </div>

        <div className="operations-table-wrapper">
          <table className="operations-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong>
                      {task.name}
                    </strong>

                    <small>
                      {
                        task.description
                      }
                    </small>
                  </td>

                  <td>
                    {task.schedule}
                  </td>

                  <td>
                    <span
                      className={taskClass(
                        task.status,
                      )}
                    >
                      {task.status}
                    </span>
                  </td>

                  <td>
                    {task.lastRun}
                  </td>

                  <td>
                    {task.nextRun}
                  </td>

                  <td>
                    {task.status ===
                    "ACTIVE" ? (
                      <button
                        type="button"
                        className="operations-small-button"
                        onClick={() =>
                          setTaskStatus(
                            task.id,
                            "PAUSED",
                          )
                        }
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="operations-small-button"
                        onClick={() =>
                          setTaskStatus(
                            task.id,
                            "ACTIVE",
                          )
                        }
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="operations-card">
        <div className="operations-card-header">
          <div>
            <h2>
              Backup Management
            </h2>

            <p>
              Create development backup
              records for platform recovery
              workflows.
            </p>
          </div>
        </div>

        <div className="operations-backup-actions">
          <button
            type="button"
            className="operations-button"
            onClick={() =>
              createBackup("FULL")
            }
          >
            Create Full Backup
          </button>

          <button
            type="button"
            className="operations-small-button"
            onClick={() =>
              createBackup(
                "CONFIGURATION",
              )
            }
          >
            Configuration Backup
          </button>

          <button
            type="button"
            className="operations-small-button"
            onClick={() =>
              createBackup("DATABASE")
            }
          >
            Database Backup
          </button>
        </div>

        {backups.length > 0 ? (
          <div className="operations-backup-list">
            {backups
              .slice(0, 8)
              .map((backup) => (
                <div
                  className="operations-backup-item"
                  key={backup.id}
                >
                  <div>
                    <strong>
                      {backup.type} Backup
                    </strong>

                    <small>
                      {formatDate(
                        backup.createdAt,
                      )}
                    </small>
                  </div>

                  <span>
                    {backup.status}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="operations-empty">
            No backup records have been
            created yet.
          </div>
        )}
      </section>
    </main>
  );
}
