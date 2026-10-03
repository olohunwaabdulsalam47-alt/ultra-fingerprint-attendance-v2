import type { UserRole } from "../../../domain/enums/roles";

export type Permission =
  | "MANAGE_USERS"
  | "MANAGE_SCHOOLS"
  | "MANAGE_CLASSES"
  | "MANAGE_STUDENTS"
  | "RECORD_ATTENDANCE"
  | "VIEW_REPORTS"
  | "VIEW_AUDIT_LOGS"
  | "REGISTER_BIOMETRIC";

const ROLE_PERMISSIONS: Record<
  UserRole,
  Permission[]
> = {
  SuperAdmin: [
    "MANAGE_SCHOOLS",
    "VIEW_REPORTS",
    "VIEW_AUDIT_LOGS",
  ],

  Principal: [
    "MANAGE_USERS",
    "MANAGE_SCHOOLS",
    "MANAGE_CLASSES",
    "MANAGE_STUDENTS",
    "RECORD_ATTENDANCE",
    "VIEW_REPORTS",
    "VIEW_AUDIT_LOGS",
    "REGISTER_BIOMETRIC",
  ],

  Teacher: [
    "RECORD_ATTENDANCE",
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
