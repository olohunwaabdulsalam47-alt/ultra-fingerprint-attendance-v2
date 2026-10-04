import type { UserRole } from "../enums/roles";

export interface AuthSession {
  userId: string;
  schoolId: string | null;
  staffId: string;
  name: string;
  role: UserRole;
  loginMethod: "PASSWORD" | "BIOMETRIC";
  createdAt: string;
}
