import { useMemo, useState } from "react";
import "./SuperAdminAuditCompliancePage.css";

type ComplianceSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

type ComplianceStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "RESOLVED";

type ComplianceEventType =
  | "AUDIT_REVIEW"
  | "POLICY_VIOLATION"
  | "DATA_ACCESS"
  | "DATA_EXPORT"
  | "PERMISSION_CHANGE"
  | "CONFIGURATION_CHANGE"
  | "RETENTION_EVENT";

interface ComplianceEvent {
  eventId: string;
  type: ComplianceEventType;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  actorName: string;
  actorId: string;
  description: string;
  resource: string;
  ipAddress: string;
  createdAt: string;
  resolvedAt?: string;
}

const STORAGE_KEY = "ultra-platform-compliance-events";

const TYPE_LABELS: Record<ComplianceEventType, string> = {
  AUDIT_REVIEW: "Audit Review",
  POLICY_VIOLATION: "Policy Violation",
  DATA_ACCESS: "Data Access",
  DATA_EXPORT: "Data Export",
  PERMISSION_CHANGE: "Permission Change",
  CONFIGURATION_CHANGE: "Configuration Change",
  RETENTION_EVENT: "Retention Event",
};

const DEMO_EVENTS: ComplianceEvent[] = [];

function loadEvents(): ComplianceEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEMO_EVENTS;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEMO_EVENTS;
    }

    return parsed as ComplianceEvent[];
  } catch {
    return DEMO_EVENTS;
  }
}

function saveEvents(events: ComplianceEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getSeverityClass(severity: ComplianceSeverity) {
  return `compliance-severity compliance-severity-${severity.toLowerCase()}`;
}

function getStatusClass(status: ComplianceStatus) {
  return `compliance-status compliance-status-${status.toLowerCase()}`;
}

export default function SuperAdminAuditCompliancePage() {
  const [events, setEvents] = useState<ComplianceEvent[]>(
    loadEvents,
  );

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<
    "ALL" | ComplianceSeverity
  >("ALL");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | ComplianceStatus
  >("ALL");

  const [typeFilter, setTypeFilter] = useState<
    "ALL" | ComplianceEventType
  >("ALL");

  const [selectedEvent, setSelectedEvent] =
    useState<ComplianceEvent | null>(null);

  const [message, setMessage] = useState("");

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        event.eventId.toLowerCase().includes(query) ||
        event.actorName.toLowerCase().includes(query) ||
        event.actorId.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.resource.toLowerCase().includes(query);

      const matchesSeverity =
        severityFilter === "ALL" ||
        event.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        event.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        event.type === typeFilter;

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    events,
    search,
    severityFilter,
    statusFilter,
    typeFilter,
  ]);

  const statistics = useMemo(() => {
    return {
      total: events.length,
      open: events.filter(
        (event) => event.status === "OPEN",
      ).length,
      acknowledged: events.filter(
        (event) => event.status === "ACKNOWLEDGED",
      ).length,
      resolved: events.filter(
        (event) => event.status === "RESOLVED",
      ).length,
      highRisk: events.filter(
        (event) =>
          event.severity === "HIGH" ||
          event.severity === "CRITICAL",
      ).length,
      dataEvents: events.filter(
        (event) =>
          event.type === "DATA_ACCESS" ||
          event.type === "DATA_EXPORT",
      ).length,
    };
  }, [events]);

  function updateEventStatus(
    eventId: string,
    status: ComplianceStatus,
  ) {
    const updatedEvents = events.map((event) => {
      if (event.eventId !== eventId) {
        return event;
      }

      return {
        ...event,
        status,
        resolvedAt:
          status === "RESOLVED"
            ? new Date().toISOString()
            : undefined,
      };
    });

    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    const updatedSelected = updatedEvents.find(
      (event) => event.eventId === eventId,
    );

    setSelectedEvent(updatedSelected ?? null);

    setMessage(
      `Compliance event ${eventId} marked as ${status.toLowerCase()}.`,
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
    <main className="superadmin-compliance-page">
      <section className="compliance-page-header">
        <div>
          <span className="compliance-eyebrow">
            SUPERADMIN CONTROL CENTER
          </span>

          <h1>Audit &amp; Compliance Center</h1>

          <p>
            Monitor platform audit activity, compliance events,
            data access, policy violations, and administrative
            changes.
          </p>
        </div>

        <div className="compliance-header-badge">
          <span className="compliance-header-dot" />
          Platform Compliance
        </div>
      </section>

      {message && (
        <div className="compliance-message">
          {message}
        </div>
      )}

      <section className="compliance-stats-grid">
        <article className="compliance-stat-card">
          <span className="compliance-stat-label">
            Total Events
          </span>
          <strong>{statistics.total}</strong>
          <small>Recorded compliance events</small>
        </article>

        <article className="compliance-stat-card">
          <span className="compliance-stat-label">
            Open
          </span>
          <strong>{statistics.open}</strong>
          <small>Require attention</small>
        </article>

        <article className="compliance-stat-card">
          <span className="compliance-stat-label">
            Acknowledged
          </span>
          <strong>{statistics.acknowledged}</strong>
          <small>Under review</small>
        </article>

        <article className="compliance-stat-card">
          <span className="compliance-stat-label">
            Resolved
          </span>
          <strong>{statistics.resolved}</strong>
          <small>Completed compliance actions</small>
        </article>

        <article className="compliance-stat-card">
          <span className="compliance-stat-label">
            High Risk
          </span>
          <strong>{statistics.highRisk}</strong>
          <small>High or critical severity</small>
        </article>

        <article className="compliance-stat-card">
          <span className="compliance-stat-label">
            Data Events
          </span>
          <strong>{statistics.dataEvents}</strong>
          <small>Access or export activity</small>
        </article>
      </section>

      <section className="compliance-overview">
        <div>
          <h2>Compliance Monitoring</h2>
          <p>
            Review administrative activity and identify events
            that may require investigation or documented action.
          </p>
        </div>

        <div className="compliance-overview-items">
          <div>
            <span>Policy Monitoring</span>
            <strong>Active</strong>
          </div>

          <div>
            <span>Audit Trail</span>
            <strong>Enabled</strong>
          </div>

          <div>
            <span>Data Access Tracking</span>
            <strong>Enabled</strong>
          </div>
        </div>
      </section>

      <section className="compliance-toolbar">
        <div className="compliance-search">
          <label htmlFor="compliance-search">
            Search events
          </label>

          <input
            id="compliance-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search event, actor, resource..."
          />
        </div>

        <div className="compliance-filter">
          <label htmlFor="compliance-severity">
            Severity
          </label>

          <select
            id="compliance-severity"
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(
                event.target.value as
                  | "ALL"
                  | ComplianceSeverity,
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

        <div className="compliance-filter">
          <label htmlFor="compliance-status">
            Status
          </label>

          <select
            id="compliance-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | ComplianceStatus,
              )
            }
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">
              Acknowledged
            </option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="compliance-filter">
          <label htmlFor="compliance-type">
            Event type
          </label>

          <select
            id="compliance-type"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                  | "ALL"
                  | ComplianceEventType,
              )
            }
          >
            <option value="ALL">All event types</option>

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
          className="compliance-clear-button"
          onClick={clearFilters}
        >
          Clear
        </button>
      </section>

      <section className="compliance-table-card">
        <div className="compliance-table-header">
          <div>
            <h2>Compliance Events</h2>
            <p>
              Showing {filteredEvents.length} of{" "}
              {events.length} events
            </p>
          </div>
        </div>

        <div className="compliance-table-wrapper">
          <table className="compliance-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Actor</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="compliance-empty-cell"
                  >
                    <div className="compliance-empty-state">
                      <strong>
                        No compliance events found
                      </strong>

                      <span>
                        There are no events matching the
                        current filters.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.eventId}>
                    <td>
                      <button
                        type="button"
                        className="compliance-event-button"
                        onClick={() =>
                          setSelectedEvent(event)
                        }
                      >
                        {event.eventId}
                      </button>
                    </td>

                    <td>
                      {TYPE_LABELS[event.type]}
                    </td>

                    <td>
                      <span
                        className={getSeverityClass(
                          event.severity,
                        )}
                      >
                        {event.severity}
                      </span>
                    </td>

                    <td>{event.actorName}</td>

                    <td>{event.resource}</td>

                    <td>
                      <span
                        className={getStatusClass(
                          event.status,
                        )}
                      >
                        {event.status}
                      </span>
                    </td>

                    <td>{formatDate(event.createdAt)}</td>

                    <td>
                      <button
                        type="button"
                        className="compliance-view-button"
                        onClick={() =>
                          setSelectedEvent(event)
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

      {selectedEvent && (
        <div
          className="compliance-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedEvent(null)}
        >
          <section
            className="compliance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compliance-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="compliance-modal-header">
              <div>
                <span className="compliance-eyebrow">
                  COMPLIANCE EVENT
                </span>

                <h2 id="compliance-modal-title">
                  {selectedEvent.eventId}
                </h2>
              </div>

              <button
                type="button"
                className="compliance-close-button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="compliance-detail-grid">
              <div>
                <span>Event Type</span>
                <strong>
                  {TYPE_LABELS[selectedEvent.type]}
                </strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>
                  <span
                    className={getSeverityClass(
                      selectedEvent.severity,
                    )}
                  >
                    {selectedEvent.severity}
                  </span>
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  <span
                    className={getStatusClass(
                      selectedEvent.status,
                    )}
                  >
                    {selectedEvent.status}
                  </span>
                </strong>
              </div>

              <div>
                <span>Actor</span>
                <strong>
                  {selectedEvent.actorName}
                </strong>
              </div>

              <div>
                <span>Actor ID</span>
                <strong>
                  {selectedEvent.actorId}
                </strong>
              </div>

              <div>
                <span>Resource</span>
                <strong>
                  {selectedEvent.resource}
                </strong>
              </div>

              <div>
                <span>IP Address</span>
                <strong>
                  {selectedEvent.ipAddress}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(selectedEvent.createdAt)}
                </strong>
              </div>

              {selectedEvent.resolvedAt && (
                <div>
                  <span>Resolved</span>
                  <strong>
                    {formatDate(
                      selectedEvent.resolvedAt,
                    )}
                  </strong>
                </div>
              )}
            </div>

            <div className="compliance-description">
              <span>Description</span>
              <p>{selectedEvent.description}</p>
            </div>

            <div className="compliance-modal-actions">
              {selectedEvent.status === "OPEN" && (
                <button
                  type="button"
                  className="compliance-secondary-button"
                  onClick={() =>
                    updateEventStatus(
                      selectedEvent.eventId,
                      "ACKNOWLEDGED",
                    )
                  }
                >
                  Acknowledge
                </button>
              )}

              {selectedEvent.status !== "RESOLVED" && (
                <button
                  type="button"
                  className="compliance-primary-button"
                  onClick={() =>
                    updateEventStatus(
                      selectedEvent.eventId,
                      "RESOLVED",
                    )
                  }
                >
                  Mark Resolved
                </button>
              )}

              <button
                type="button"
                className="compliance-cancel-button"
                onClick={() => setSelectedEvent(null)}
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
