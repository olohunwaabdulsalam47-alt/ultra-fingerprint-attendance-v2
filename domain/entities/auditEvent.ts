export interface AuditEvent {
  auditEventId: string;
  userId: string;
  action: string;
  description: string;
  createdAt: string;
}
