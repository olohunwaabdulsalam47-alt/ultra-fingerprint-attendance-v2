export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
} as const;

export type UserRole =
  (typeof USER_ROLES)[keyof typeof USER_ROLES];
