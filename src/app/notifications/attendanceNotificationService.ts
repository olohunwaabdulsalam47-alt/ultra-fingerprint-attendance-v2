import type { Guardian } from "../../../domain/entities/guardian";
import type {
  AttendanceStatus,
} from "../../../domain/enums/attendanceStatus";
import type {
  NotificationChannel,
  NotificationEvent,
} from "../../../domain/entities/notificationEvent";
import {
  getGuardiansByStudent,
} from "../../../data/repositories/guardianRepository";
import {
  saveNotificationEvent,
} from "../../../data/repositories/notificationEventRepository";

function createNotificationId(): string {
  return `notification-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getNotificationType(
  status: AttendanceStatus,
): NotificationEvent["type"] {
  switch (status) {
    case "Present":
      return "ATTENDANCE_PRESENT";

    case "Late":
      return "ATTENDANCE_LATE";

    case "Absent":
      return "ATTENDANCE_ABSENT";

    default:
      return "GENERAL";
  }
}

function getMessage(
  studentName: string,
  status: AttendanceStatus,
): string {
  switch (status) {
    case "Present":
      return `${studentName} has been marked present at school today.`;

    case "Late":
      return `${studentName} has arrived late at school today.`;

    case "Absent":
      return `${studentName} has been marked absent from school today.`;

    default:
      return `Attendance update for ${studentName}.`;
  }
}

function getRecipient(
  guardian: Guardian,
): string {
  if (
    guardian.preferredContactMethod === "EMAIL" &&
    guardian.email
  ) {
    return guardian.email;
  }

  return guardian.phone;
}

function shouldNotifyGuardian(
  guardian: Guardian,
): boolean {
  return (
    guardian.status === "active" &&
    guardian.receiveAttendanceAlerts === true
  );
}

export async function createAttendanceNotificationEvents(
  schoolId: string,
  studentId: string,
  studentName: string,
  status: AttendanceStatus,
): Promise<NotificationEvent[]> {
  const guardians = await getGuardiansByStudent(studentId);

  const eligibleGuardians = guardians.filter(
    shouldNotifyGuardian,
  );

  const notificationType = getNotificationType(status);
  const message = getMessage(studentName, status);

  const events: NotificationEvent[] = [];

  for (const guardian of eligibleGuardians) {
    const channel: NotificationChannel =
      guardian.preferredContactMethod;

    const recipient = getRecipient(guardian);

    if (!recipient.trim()) {
      continue;
    }

    const now = new Date().toISOString();

    const event: NotificationEvent = {
      notificationId: createNotificationId(),
      schoolId,
      studentId,
      guardianId: guardian.guardianId,
      channel,
      type: notificationType,
      recipient,
      subject:
        status === "Absent"
          ? "Student Attendance Alert"
          : "Student Attendance Update",
      message,
      status: "PENDING",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    await saveNotificationEvent(event);

    events.push(event);
  }

  return events;
}
