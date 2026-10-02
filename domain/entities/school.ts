export type SchoolStatus = "active" | "inactive";

export interface School {
  schoolId: string;
  name: string;
  status: SchoolStatus;
  createdAt: string;
  updatedAt: string;
}
