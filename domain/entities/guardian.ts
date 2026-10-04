export type GuardianStatus = "active" | "inactive";

export type GuardianRelationship =
  | "Father"
  | "Mother"
  | "Guardian"
  | "Grandparent"
  | "Sibling"
  | "Other";

export interface Guardian {
  guardianId: string;
  schoolId: string;
  studentId: string;
  fullName: string;
  relationship: GuardianRelationship;
  phone: string;
  email?: string;
  address?: string;
  preferredContactMethod: "SMS" | "WHATSAPP" | "EMAIL";
  receiveAttendanceAlerts: boolean;
  receiveAcademicAlerts: boolean;
  receiveGeneralNotifications: boolean;
  status: GuardianStatus;
  createdAt: string;
  updatedAt: string;
}
