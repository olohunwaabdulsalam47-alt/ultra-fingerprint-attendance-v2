import type { UserRole } from "../../../domain/enums/roles";

export type Permission =
  | "VIEW_DASHBOARD"
  | "MANAGE_USERS"
  | "MANAGE_SCHOOLS"
  | "MANAGE_CLASSES"
  | "MANAGE_STUDENTS"
  | "RECORD_ATTENDANCE"
  | "VIEW_REPORTS"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_BIOMETRIC"
  | "REGISTER_BIOMETRIC";

const ROLE_PERMISSIONS: Record<
  UserRole,
  Permission[]
> = {
  SuperAdmin: [
    "VIEW_DASHBOARD",
    "MANAGE_SCHOOLS",
    "VIEW_REPORTS",
    "VIEW_AUDIT_LOGS",
  ],

  Principal: [
    "VIEW_DASHBOARD",
    "MANAGE_USERS",
    "MANAGE_SCHOOLS",
    "MANAGE_CLASSES",
    "MANAGE_STUDENTS",
    "RECORD_ATTENDANCE",
    "VIEW_REPORTS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_BIOMETRIC",
    "REGISTER_BIOMETRIC",
  ],

  Teacher: [
    "VIEW_DASHBOARD",
    "RECORD_ATTENDANCE",
    "MANAGE_BIOMETRIC",
    "REGISTER_BIOMETRIC",
  ],
};

export function getRolePermissions(
  role: UserRole,
): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return getRolePermissions(role).includes(
    permission,
  );
}
