import { useEffect, useState } from "react";
import type { AuditEvent } from "../../../domain/entities/auditEvent";
import {
  getAuditEvents,
} from "../../../data/repositories/auditEventRepository";

export default function AuditLogsPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState("");

  async function loadAuditEvents() {
    try {
      const savedEvents = await getAuditEvents();
      setEvents(savedEvents);
      setError("");
    } catch {
      setError("Unable to load audit logs.");
    }
  }

  useEffect(() => {
    void loadAuditEvents();
  }, []);

  return (
    <section>
      <h2>Audit Logs</h2>

      {error && <p role="alert">{error}</p>}

      {events.length === 0 ? (
        <p>No audit events have been recorded yet.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.auditEventId}>
              <strong>{event.action}</strong> —{" "}
              {event.description} — User:{" "}
              {event.userId} —{" "}
              {event.createdAt}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
