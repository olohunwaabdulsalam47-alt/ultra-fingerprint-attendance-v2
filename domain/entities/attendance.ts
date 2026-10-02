import type { AttendanceStatus } from "../enums/attendanceStatus";

export interface Attendance {
  attendanceId: string;
  schoolId: string;
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
