export const DATABASE_NAME = "ultra-fingerprint-attendance";

export const DATABASE_VERSION = 2;

export const STORE_NAMES = {
  SCHOOLS: "schools",
  USERS: "users",
  CLASSES: "classes",
  STUDENTS: "students",
  ATTENDANCE: "attendance",
  WEBAUTHN_CREDENTIALS: "webauthnCredentials",
  AUDIT_EVENTS: "auditEvents",
  OFFLINE_OPERATIONS: "offlineOperations",
  CONFIGURATION: "configuration",
  SCHEMA_METADATA: "schemaMetadata",

  GUARDIANS: "guardians",
  NOTIFICATION_EVENTS: "notificationEvents",
} as const;

export type StoreName =
  (typeof STORE_NAMES)[keyof typeof STORE_NAMES];
