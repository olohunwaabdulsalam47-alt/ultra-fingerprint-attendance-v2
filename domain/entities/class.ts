export type SchoolClassStatus = "active" | "inactive";

export interface SchoolClass {
  classId: string;
  schoolId: string;
  name: string;
  status: SchoolClassStatus;
  createdAt: string;
  updatedAt: string;
}
