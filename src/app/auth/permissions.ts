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
  | "REGISTER_BIOMETRIC"
  | "MANAGE_PLATFORM";

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  "VIEW_DASHBOARD",
  "VIEW_REPORTS",
  "VIEW_AUDIT_LOGS",
  "MANAGE_PLATFORM",
];

const PRINCIPAL_PERMISSIONS: Permission[] = [
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
];

const TEACHER_PERMISSIONS: Permission[] = [
  "VIEW_DASHBOARD",
  "RECORD_ATTENDANCE",
  "REGISTER_BIOMETRIC",
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SuperAdmin: SUPER_ADMIN_PERMISSIONS,
  Principal: PRINCIPAL_PERMISSIONS,
  Teacher: TEACHER_PERMISSIONS,
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
  return getRolePermissions(role).includes(permission);
}
