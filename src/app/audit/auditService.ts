import type { AuditEvent } from "../../../domain/entities/auditEvent";
import { saveAuditEvent } from "../../../data/repositories/auditEventRepository";

export async function recordAuditEvent(
  userId: string,
  action: string,
  description: string,
): Promise<AuditEvent> {
  const now = new Date().toISOString();

  const event: AuditEvent = {
    auditEventId: crypto.randomUUID(),
    userId,
    action,
    description,
    createdAt: now,
  };

  await saveAuditEvent(event);

  return event;
}
