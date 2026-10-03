import { useMemo, useState } from "react";
import "./SuperAdminSupportIncidentPage.css";

type IncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

type IncidentStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

type IncidentType =
  | "SUPPORT_REQUEST"
  | "SYSTEM_INCIDENT"
  | "SECURITY_INCIDENT"
  | "PAYMENT_ISSUE"
  | "ACCOUNT_ISSUE"
  | "DATA_ISSUE"
  | "TECHNICAL_ISSUE";

interface SupportIncident {
  incidentId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  subject: string;
  description: string;
  requesterName: string;
  requesterId: string;
  schoolName: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const STORAGE_KEY = "ultra-platform-support-incidents";

const TYPE_LABELS: Record<IncidentType, string> = {
  SUPPORT_REQUEST: "Support Request",
  SYSTEM_INCIDENT: "System Incident",
  SECURITY_INCIDENT: "Security Incident",
  PAYMENT_ISSUE: "Payment Issue",
  ACCOUNT_ISSUE: "Account Issue",
  DATA_ISSUE: "Data Issue",
  TECHNICAL_ISSUE: "Technical Issue",
};

const DEMO_INCIDENTS: SupportIncident[] = [];

function loadIncidents(): SupportIncident[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEMO_INCIDENTS;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEMO_INCIDENTS;
    }

    return parsed as SupportIncident[];
  } catch {
    return DEMO_INCIDENTS;
  }
}

function saveIncidents(incidents: SupportIncident[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(incidents),
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function severityClass(severity: IncidentSeverity) {
  return `incident-severity incident-severity-${severity.toLowerCase()}`;
}

function statusClass(status: IncidentStatus) {
  return `incident-status incident-status-${status.toLowerCase()}`;
}

export default function SuperAdminSupportIncidentPage() {
  const [incidents, setIncidents] = useState<
    SupportIncident[]
  >(loadIncidents);

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] = useState<
    "ALL" | IncidentSeverity
  >("ALL");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | IncidentStatus
  >("ALL");

  const [typeFilter, setTypeFilter] = useState<
    "ALL" | IncidentType
  >("ALL");

  const [selectedIncident, setSelectedIncident] =
    useState<SupportIncident | null>(null);

  const [message, setMessage] = useState("");

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incidents.filter((incident) => {
      const matchesSearch =
        !query ||
        incident.incidentId.toLowerCase().includes(query) ||
        incident.subject.toLowerCase().includes(query) ||
        incident.description.toLowerCase().includes(query) ||
        incident.requesterName
          .toLowerCase()
          .includes(query) ||
        incident.requesterId.toLowerCase().includes(query) ||
        incident.schoolName.toLowerCase().includes(query) ||
        incident.assignedTo.toLowerCase().includes(query);

      const matchesSeverity =
        severityFilter === "ALL" ||
        incident.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        incident.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        incident.type === typeFilter;

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    incidents,
    search,
    severityFilter,
    statusFilter,
    typeFilter,
  ]);

  const statistics = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter(
        (incident) => incident.status === "OPEN",
      ).length,
      inProgress: incidents.filter(
        (incident) => incident.status === "IN_PROGRESS",
      ).length,
      resolved: incidents.filter(
        (incident) => incident.status === "RESOLVED",
      ).length,
      critical: incidents.filter(
        (incident) => incident.severity === "CRITICAL",
      ).length,
      security: incidents.filter(
        (incident) => incident.type === "SECURITY_INCIDENT",
      ).length,
    };
  }, [incidents]);

  function updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
  ) {
    const now = new Date().toISOString();

    const updatedIncidents = incidents.map((incident) => {
      if (incident.incidentId !== incidentId) {
        return incident;
      }

      return {
        ...incident,
        status,
        updatedAt: now,
        resolvedAt:
          status === "RESOLVED" || status === "CLOSED"
            ? now
            : undefined,
      };
    });

    setIncidents(updatedIncidents);
    saveIncidents(updatedIncidents);

    const updatedSelected = updatedIncidents.find(
      (incident) => incident.incidentId === incidentId,
    );

    setSelectedIncident(updatedSelected ?? null);

    setMessage(
      `Incident ${incidentId} updated to ${status
        .toLowerCase()
        .replace("_", " ")}.`,
    );

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function clearFilters() {
    setSearch("");
    setSeverityFilter("ALL");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  }

  return (
    <main className="superadmin-support-page">
      <section className="support-page-header">
        <div>
          <span className="support-eyebrow">
            SUPERADMIN CONTROL CENTER
          </span>

          <h1>Support &amp; Incident Center</h1>

          <p>
            Manage platform support requests, operational
            incidents, technical issues, account problems,
            payment issues, and critical service events.
          </p>
        </div>

        <div className="support-header-badge">
          <span className="support-header-dot" />
          Platform Operations
        </div>
      </section>

      {message && (
        <div className="support-message">
          {message}
        </div>
      )}

      <section className="support-stats-grid">
        <article className="support-stat-card">
          <span className="support-stat-label">
            Total Cases
          </span>
          <strong>{statistics.total}</strong>
          <small>Support and incident records</small>
        </article>

        <article className="support-stat-card">
          <span className="support-stat-label">
            Open
          </span>
          <strong>{statistics.open}</strong>
          <small>Awaiting action</small>
        </article>

        <article className="support-stat-card">
          <span className="support-stat-label">
            In Progress
          </span>
          <strong>{statistics.inProgress}</strong>
          <small>Currently being handled</small>
        </article>

        <article className="support-stat-card">
          <span className="support-stat-label">
            Resolved
          </span>
          <strong>{statistics.resolved}</strong>
          <small>Cases resolved</small>
        </article>

        <article className="support-stat-card">
          <span className="support-stat-label">
            Critical
          </span>
          <strong>{statistics.critical}</strong>
          <small>Critical severity cases</small>
        </article>

        <article className="support-stat-card">
          <span className="support-stat-label">
            Security
          </span>
          <strong>{statistics.security}</strong>
          <small>Security-related cases</small>
        </article>
      </section>

      <section className="support-overview">
        <div>
          <h2>Operations Overview</h2>

          <p>
            Centralize platform support and incident handling
            so SuperAdmin can track ownership, severity,
            progress, and resolution.
          </p>
        </div>

        <div className="support-overview-items">
          <div>
            <span>Support Queue</span>
            <strong>Active</strong>
          </div>

          <div>
            <span>Incident Tracking</span>
            <strong>Enabled</strong>
          </div>

          <div>
            <span>Escalation Monitoring</span>
            <strong>Enabled</strong>
          </div>
        </div>
      </section>

      <section className="support-toolbar">
        <div className="support-search">
          <label htmlFor="support-search">
            Search cases
          </label>

          <input
            id="support-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search case, requester, school..."
          />
        </div>

        <div className="support-filter">
          <label htmlFor="support-severity">
            Severity
          </label>

          <select
            id="support-severity"
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(
                event.target.value as
                  | "ALL"
                  | IncidentSeverity,
              )
            }
          >
            <option value="ALL">All severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="support-filter">
          <label htmlFor="support-status">
            Status
          </label>

          <select
            id="support-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | IncidentStatus,
              )
            }
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">
              In Progress
            </option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="support-filter">
          <label htmlFor="support-type">
            Case type
          </label>

          <select
            id="support-type"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                  | "ALL"
                  | IncidentType,
              )
            }
          >
            <option value="ALL">All case types</option>

            {Object.entries(TYPE_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <button
          type="button"
          className="support-clear-button"
          onClick={clearFilters}
        >
          Clear
        </button>
      </section>

      <section className="support-table-card">
        <div className="support-table-header">
          <div>
            <h2>Support &amp; Incident Cases</h2>

            <p>
              Showing {filteredIncidents.length} of{" "}
              {incidents.length} cases
            </p>
          </div>
        </div>

        <div className="support-table-wrapper">
          <table className="support-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Requester</th>
                <th>School</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="support-empty-cell"
                  >
                    <div className="support-empty-state">
                      <strong>
                        No support or incident cases found
                      </strong>

                      <span>
                        There are no cases matching the
                        current filters.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.incidentId}>
                    <td>
                      <button
                        type="button"
                        className="support-case-button"
                        onClick={() =>
                          setSelectedIncident(incident)
                        }
                      >
                        {incident.incidentId}
                      </button>
                    </td>

                    <td>{incident.subject}</td>

                    <td>
                      {TYPE_LABELS[incident.type]}
                    </td>

                    <td>
                      <span
                        className={severityClass(
                          incident.severity,
                        )}
                      >
                        {incident.severity}
                      </span>
                    </td>

                    <td>{incident.requesterName}</td>

                    <td>{incident.schoolName}</td>

                    <td>{incident.assignedTo}</td>

                    <td>
                      <span
                        className={statusClass(
                          incident.status,
                        )}
                      >
                        {incident.status.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </td>

                    <td>
                      {formatDate(incident.updatedAt)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="support-view-button"
                        onClick={() =>
                          setSelectedIncident(incident)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedIncident && (
        <div
          className="support-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedIncident(null)}
        >
          <section
            className="support-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="support-modal-header">
              <div>
                <span className="support-eyebrow">
                  SUPPORT / INCIDENT
                </span>

                <h2 id="support-modal-title">
                  {selectedIncident.incidentId}
                </h2>
              </div>

              <button
                type="button"
                className="support-close-button"
                onClick={() =>
                  setSelectedIncident(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="support-subject">
              <span>Subject</span>
              <strong>{selectedIncident.subject}</strong>
            </div>

            <div className="support-detail-grid">
              <div>
                <span>Case Type</span>
                <strong>
                  {TYPE_LABELS[selectedIncident.type]}
                </strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>
                  <span
                    className={severityClass(
                      selectedIncident.severity,
                    )}
                  >
                    {selectedIncident.severity}
                  </span>
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  <span
                    className={statusClass(
                      selectedIncident.status,
                    )}
                  >
                    {selectedIncident.status.replace(
                      "_",
                      " ",
                    )}
                  </span>
                </strong>
              </div>

              <div>
                <span>Requester</span>
                <strong>
                  {selectedIncident.requesterName}
                </strong>
              </div>

              <div>
                <span>Requester ID</span>
                <strong>
                  {selectedIncident.requesterId}
                </strong>
              </div>

              <div>
                <span>School</span>
                <strong>
                  {selectedIncident.schoolName}
                </strong>
              </div>

              <div>
                <span>Assigned To</span>
                <strong>
                  {selectedIncident.assignedTo}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(
                    selectedIncident.createdAt,
                  )}
                </strong>
              </div>

              <div>
                <span>Updated</span>
                <strong>
                  {formatDate(
                    selectedIncident.updatedAt,
                  )}
                </strong>
              </div>

              {selectedIncident.resolvedAt && (
                <div>
                  <span>Resolved</span>
                  <strong>
                    {formatDate(
                      selectedIncident.resolvedAt,
                    )}
                  </strong>
                </div>
              )}
            </div>

            <div className="support-description">
              <span>Description</span>
              <p>{selectedIncident.description}</p>
            </div>

            <div className="support-modal-actions">
              {selectedIncident.status === "OPEN" && (
                <button
                  type="button"
                  className="support-secondary-button"
                  onClick={() =>
                    updateIncidentStatus(
                      selectedIncident.incidentId,
                      "IN_PROGRESS",
                    )
                  }
                >
                  Start Handling
                </button>
              )}

              {selectedIncident.status ===
                "IN_PROGRESS" && (
                <button
                  type="button"
                  className="support-primary-button"
                  onClick={() =>
                    updateIncidentStatus(
                      selectedIncident.incidentId,
                      "RESOLVED",
                    )
                  }
                >
                  Mark Resolved
                </button>
              )}

              {selectedIncident.status === "RESOLVED" && (
                <button
                  type="button"
                  className="support-primary-button"
                  onClick={() =>
                    updateIncidentStatus(
                      selectedIncident.incidentId,
                      "CLOSED",
                    )
                  }
                >
                  Close Case
                </button>
              )}

              {selectedIncident.status !== "CLOSED" &&
                selectedIncident.status !==
                  "IN_PROGRESS" &&
                selectedIncident.status !== "RESOLVED" && (
                  <button
                    type="button"
                    className="support-primary-button"
                    onClick={() =>
                      updateIncidentStatus(
                        selectedIncident.incidentId,
                        "RESOLVED",
                      )
                    }
                  >
                    Mark Resolved
                  </button>
                )}

              <button
                type="button"
                className="support-cancel-button"
                onClick={() =>
                  setSelectedIncident(null)
                }
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
