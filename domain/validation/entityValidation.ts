import type { Attendance } from "../entities/attendance";
import type { School } from "../entities/school";
import type { SchoolClass } from "../entities/class";
import type { Student } from "../entities/student";
import type { User } from "../entities/user";
import { isNonEmptyString, isValidId } from "./validation";
import { ATTENDANCE_STATUSES } from "../enums/attendanceStatus";
import { USER_ROLES } from "../enums/roles";

export function isValidSchool(school: School): boolean {
  return (
    isValidId(school.schoolId) &&
    isNonEmptyString(school.name) &&
    (school.status === "active" || school.status === "inactive") &&
    isNonEmptyString(school.createdAt) &&
    isNonEmptyString(school.updatedAt)
  );
}

export function isValidSchoolClass(
  schoolClass: SchoolClass,
): boolean {
  return (
    isValidId(schoolClass.classId) &&
    isValidId(schoolClass.schoolId) &&
    isNonEmptyString(schoolClass.name) &&
    (schoolClass.status === "active" ||
      schoolClass.status === "inactive")
  );
}

export function isValidStudent(student: Student): boolean {
  return (
    isValidId(student.studentId) &&
    isValidId(student.schoolId) &&
    isNonEmptyString(student.name) &&
    isValidId(student.classId) &&
    (student.status === "active" || student.status === "inactive") &&
    isNonEmptyString(student.createdAt) &&
    isNonEmptyString(student.updatedAt)
  );
}

export function isValidUser(user: User): boolean {
  const validRole = Object.values(USER_ROLES).includes(user.role);

  return (
    isValidId(user.userId) &&
    validRole &&
    isNonEmptyString(user.name) &&
    (user.schoolId === null || isValidId(user.schoolId)) &&
    (user.staffId === undefined || isNonEmptyString(user.staffId)) &&
    (user.status === "active" || user.status === "inactive") &&
    isNonEmptyString(user.createdAt) &&
    isNonEmptyString(user.updatedAt)
  );
}

export function isValidAttendance(
  attendance: Attendance,
): boolean {
  return (
    isValidId(attendance.attendanceId) &&
    isValidId(attendance.schoolId) &&
    isValidId(attendance.classId) &&
    isValidId(attendance.studentId) &&
    isNonEmptyString(attendance.date) &&
    Object.values(ATTENDANCE_STATUSES).includes(
      attendance.status,
    ) &&
    isNonEmptyString(attendance.createdAt) &&
    isNonEmptyString(attendance.updatedAt) &&
    isValidId(attendance.createdBy)
  );
}
