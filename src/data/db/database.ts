export const DATABASE_NAME =
  "ultra-fingerprint-attendance";

export const DATABASE_VERSION = 1;

export const STORE_NAMES = {
  SCHOOLS: "schools",
  USERS: "users",
  CLASSES: "classes",
  STUDENTS: "students",
  ATTENDANCE: "attendance",
  WEBAUTHN_CREDENTIALS:
    "webauthnCredentials",
  AUDIT_EVENTS: "auditEvents",
  OFFLINE_OPERATIONS: "offlineOperations",
  CONFIGURATION: "configuration",
  SCHEMA_METADATA: "schemaMetadata",
} as const;
