import { useMemo, useState } from "react";
import "./SuperAdminSecurityPage.css";

type SecuritySeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

type SecurityStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "RESOLVED";

type SecurityEventType =
  | "FAILED_LOGIN"
  | "SUSPICIOUS_ACTIVITY"
  | "ACCOUNT_LOCKOUT"
  | "PRIVILEGED_ACTION"
  | "SECURITY_CONFIGURATION"
  | "ACCESS_VIOLATION";

interface SecurityEvent {
  eventId: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  status: SecurityStatus;
  userName: string;
  userId: string;
  description: string;
  ipAddress: string;
  location: string;
  createdAt: string;
  resolvedAt?: string;
}

const STORAGE_KEY = "ultra-platform-security-events";

const DEMO_EVENTS: SecurityEvent[] = [];

const TYPE_LABELS: Record<SecurityEventType, string> = {
  FAILED_LOGIN: "Failed Login",
  SUSPICIOUS_ACTIVITY: "Suspicious Activity",
  ACCOUNT_LOCKOUT: "Account Lockout",
  PRIVILEGED_ACTION: "Privileged Action",
  SECURITY_CONFIGURATION: "Security Configuration",
  ACCESS_VIOLATION: "Access Violation",
};

const SEVERITY_LABELS: Record<
  SecuritySeverity,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

function loadEvents(): SecurityEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEMO_EVENTS),
      );

      return DEMO_EVENTS;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEMO_EVENTS;
    }

    return parsed as SecurityEvent[];
  } catch {
    return DEMO_EVENTS;
  }
}

function saveEvents(events: SecurityEvent[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(events),
  );
}

function formatDate(value: string) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SuperAdminSecurityPage() {
  const [events, setEvents] =
    useState<SecurityEvent[]>(loadEvents);

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] =
    useState<"ALL" | SecuritySeverity>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | SecurityStatus>("ALL");

  const [typeFilter, setTypeFilter] =
    useState<"ALL" | SecurityEventType>("ALL");

  const [selectedEvent, setSelectedEvent] =
    useState<SecurityEvent | null>(null);

  const [message, setMessage] = useState("");

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        event.eventId.toLowerCase().includes(query) ||
        event.userName.toLowerCase().includes(query) ||
        event.userId.toLowerCase().includes(query) ||
        event.description
          .toLowerCase()
          .includes(query) ||
        event.ipAddress
          .toLowerCase()
          .includes(query);

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

  const openCount = events.filter(
    (event) => event.status === "OPEN",
  ).length;

  const acknowledgedCount = events.filter(
    (event) => event.status === "ACKNOWLEDGED",
  ).length;

  const criticalCount = events.filter(
    (event) =>
      event.severity === "CRITICAL" &&
      event.status !== "RESOLVED",
  ).length;

  const highCount = events.filter(
    (event) =>
      event.severity === "HIGH" &&
      event.status !== "RESOLVED",
  ).length;

  function updateEvents(
    nextEvents: SecurityEvent[],
  ) {
    setEvents(nextEvents);
    saveEvents(nextEvents);
  }

  function updateEventStatus(
    eventId: string,
    status: SecurityStatus,
  ) {
    const nextEvents: SecurityEvent[] =
      events.map((event): SecurityEvent => {
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

    updateEvents(nextEvents);

    const updatedEvent = nextEvents.find(
      (event) => event.eventId === eventId,
    );

    if (updatedEvent) {
      setSelectedEvent(updatedEvent);

      setMessage(
        `Security event ${updatedEvent.eventId} marked ${updatedEvent.status.toLowerCase()}.`,
      );
    }
  }

  function clearFilters() {
    setSearch("");
    setSeverityFilter("ALL");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  }

  return (
    <section className="superadmin-security-page">
      <header className="superadmin-security-header">
        <div>
          <p className="security-eyebrow">
            PLATFORM SECURITY
          </p>

          <h1>Security Center</h1>

          <p>
            Monitor security events, privileged activity,
            access violations, and platform protection
            signals.
          </p>
        </div>

        <div className="security-status-indicator">
          <span className="security-status-dot" />
          Monitoring Active
        </div>
      </header>

      {message && (
        <div className="security-message">
          {message}
        </div>
      )}

      <div className="security-stat-grid">
        <article className="security-stat-card">
          <span>Open Alerts</span>
          <strong>{openCount}</strong>
          <small>Require attention</small>
        </article>

        <article className="security-stat-card">
          <span>Acknowledged</span>
          <strong>{acknowledgedCount}</strong>
          <small>Under review</small>
        </article>

        <article className="security-stat-card critical-card">
          <span>Critical</span>
          <strong>{criticalCount}</strong>
          <small>Unresolved critical events</small>
        </article>

        <article className="security-stat-card high-card">
          <span>High Severity</span>
          <strong>{highCount}</strong>
          <small>Unresolved high events</small>
        </article>
      </div>

      <div className="security-overview">
        <div className="security-overview-card">
          <div className="overview-icon">✓</div>

          <div>
            <strong>Platform monitoring</strong>
            <span>
              Security events are available for
              administrative review.
            </span>
          </div>
        </div>

        <div className="security-overview-card">
          <div className="overview-icon">!</div>

          <div>
            <strong>Privileged access</strong>
            <span>
              Platform-level administrative actions can
              be reviewed from this center.
            </span>
          </div>
        </div>

        <div className="security-overview-card">
          <div className="overview-icon">↻</div>

          <div>
            <strong>Event lifecycle</strong>
            <span>
              Alerts can be acknowledged and resolved
              after investigation.
            </span>
          </div>
        </div>
      </div>

      <div className="security-toolbar">
        <input
          type="search"
          placeholder="Search event, user, ID, IP..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={severityFilter}
          onChange={(event) =>
            setSeverityFilter(
              event.target.value as
                | "ALL"
                | SecuritySeverity,
            )
          }
        >
          <option value="ALL">
            All severity
          </option>

          {Object.entries(SEVERITY_LABELS).map(
            ([severity, label]) => (
              <option
                key={severity}
                value={severity}
              >
                {label}
              </option>
            ),
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "ALL"
                | SecurityStatus,
            )
          }
        >
          <option value="ALL">
            All statuses
          </option>

          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">
            Acknowledged
          </option>
          <option value="RESOLVED">
            Resolved
          </option>
        </select>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value as
                | "ALL"
                | SecurityEventType,
            )
          }
        >
          <option value="ALL">
            All event types
          </option>

          {Object.entries(TYPE_LABELS).map(
            ([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ),
          )}
        </select>

        <button
          className="clear-filters-button"
          type="button"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      <div className="security-table-card">
        <div className="security-table-heading">
          <div>
            <p className="security-eyebrow">
              SECURITY EVENTS
            </p>

            <h2>Security Activity</h2>

            <span>
              {filteredEvents.length} event
              {filteredEvents.length === 1
                ? ""
                : "s"} found
            </span>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="security-empty">
            <div className="empty-shield">✓</div>

            <strong>No security events found</strong>

            <p>
              There are currently no events matching
              the selected filters.
            </p>
          </div>
        ) : (
          <div className="security-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.eventId}>
                    <td>
                      <div className="event-cell">
                        <strong>
                          {event.eventId}
                        </strong>

                        <span>
                          {event.description}
                        </span>
                      </div>
                    </td>

                    <td>
                      {TYPE_LABELS[event.type]}
                    </td>

                    <td>
                      <span
                        className={`severity-badge ${event.severity.toLowerCase()}`}
                      >
                        {SEVERITY_LABELS[
                          event.severity
                        ]}
                      </span>
                    </td>

                    <td>
                      <div className="event-user">
                        <strong>
                          {event.userName}
                        </strong>

                        <span>
                          {event.userId}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`event-status ${event.status.toLowerCase()}`}
                      >
                        {event.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(event.createdAt)}
                    </td>

                    <td>
                      <button
                        className="security-view-button"
                        type="button"
                        onClick={() =>
                          setSelectedEvent(event)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="security-modal-backdrop">
          <div className="security-modal">
            <div className="security-modal-header">
              <div>
                <p className="security-eyebrow">
                  SECURITY EVENT
                </p>

                <h2>{selectedEvent.eventId}</h2>
              </div>

              <button
                className="security-close-button"
                type="button"
                onClick={() =>
                  setSelectedEvent(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="security-detail-banner">
              <span
                className={`severity-badge ${selectedEvent.severity.toLowerCase()}`}
              >
                {SEVERITY_LABELS[
                  selectedEvent.severity
                ]}
              </span>

              <span
                className={`event-status ${selectedEvent.status.toLowerCase()}`}
              >
                {selectedEvent.status}
              </span>
            </div>

            <div className="security-description">
              <span>Description</span>
              <strong>
                {selectedEvent.description}
              </strong>
            </div>

            <div className="security-details-grid">
              <div>
                <span>Event Type</span>
                <strong>
                  {TYPE_LABELS[selectedEvent.type]}
                </strong>
              </div>

              <div>
                <span>User</span>
                <strong>
                  {selectedEvent.userName}
                </strong>
              </div>

              <div>
                <span>User ID</span>
                <strong>
                  {selectedEvent.userId}
                </strong>
              </div>

              <div>
                <span>IP Address</span>
                <strong>
                  {selectedEvent.ipAddress}
                </strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  {selectedEvent.location}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(
                    selectedEvent.createdAt,
                  )}
                </strong>
              </div>
            </div>

            {selectedEvent.resolvedAt && (
              <div className="resolved-info">
                Resolved at{" "}
                {formatDate(
                  selectedEvent.resolvedAt,
                )}
              </div>
            )}

            <div className="security-modal-actions">
              {selectedEvent.status === "OPEN" && (
                <button
                  className="acknowledge-button"
                  type="button"
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

              {selectedEvent.status !==
                "RESOLVED" && (
                <button
                  className="resolve-button"
                  type="button"
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
                className="security-secondary-button"
                type="button"
                onClick={() =>
                  setSelectedEvent(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
