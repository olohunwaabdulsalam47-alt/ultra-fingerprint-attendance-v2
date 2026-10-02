import type { UserRole } from "../../../domain/enums/roles";

export type Permission =
  | "VIEW_DASHBOARD"
  | "MANAGE_SCHOOLS"
  | "MANAGE_CLASSES"
  | "MANAGE_STUDENTS"
  | "RECORD_ATTENDANCE"
  | "VIEW_REPORTS"
  | "MANAGE_USERS"
  | "MANAGE_BIOMETRIC"
  | "VIEW_AUDIT_LOGS";

const ALL_PERMISSIONS: Permission[] = [
  "VIEW_DASHBOARD",
  "MANAGE_SCHOOLS",
  "MANAGE_CLASSES",
  "MANAGE_STUDENTS",
  "RECORD_ATTENDANCE",
  "VIEW_REPORTS",
  "MANAGE_USERS",
  "MANAGE_BIOMETRIC",
  "VIEW_AUDIT_LOGS",
];

const ROLE_PERMISSIONS: Record<
  UserRole,
  Permission[]
> = {
  SuperAdmin: ALL_PERMISSIONS,

  Principal: [
    "VIEW_DASHBOARD",
    "MANAGE_CLASSES",
    "MANAGE_STUDENTS",
    "RECORD_ATTENDANCE",
    "VIEW_REPORTS",
    "MANAGE_BIOMETRIC",
  ],

  Teacher: [
    "VIEW_DASHBOARD",
    "MANAGE_STUDENTS",
    "RECORD_ATTENDANCE",
    "VIEW_REPORTS",
    "MANAGE_BIOMETRIC",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getRolePermissions(
  role: UserRole,
): Permission[] {
  return ROLE_PERMISSIONS[role];
}
