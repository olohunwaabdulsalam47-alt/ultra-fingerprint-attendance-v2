export type StudentStatus = "active" | "inactive";

export interface Student {
  studentId: string;
  schoolId: string;
  name: string;
  classId: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}
