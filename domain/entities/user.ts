import type { UserRole } from "../enums/roles";

export type UserStatus = "active" | "inactive";

export interface User {
  userId: string;
  schoolId: string | null;
  role: UserRole;
  name: string;
  staffId?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
