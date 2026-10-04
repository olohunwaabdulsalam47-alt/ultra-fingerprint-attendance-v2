import type { NotificationEvent } from "../../../domain/entities/notificationEvent";
import {
  getPendingNotificationEventsBySchool,
  saveNotificationEvent,
} from "../../../data/repositories/notificationEventRepository";
import {
  getStudentByIdForSchool,
} from "../../../data/repositories/studentRepository";
import {
  getGuardianByIdForSchool,
} from "../../../data/repositories/guardianRepository";

async function verifyNotificationOwnership(
  event: NotificationEvent,
  schoolId: string,
): Promise<void> {
  if (event.schoolId !== schoolId) {
    throw new Error(
      "Notification does not belong to the supplied school.",
    );
  }

  const student =
    await getStudentByIdForSchool(
      event.studentId,
      schoolId,
    );

  if (!student) {
    throw new Error(
      "Notification student does not belong to the supplied school.",
    );
  }

  const guardian =
    await getGuardianByIdForSchool(
      event.guardianId,
      schoolId,
    );

  if (!guardian) {
    throw new Error(
      "Notification guardian does not belong to the supplied school.",
    );
  }

  if (guardian.studentId !== event.studentId) {
    throw new Error(
      "Notification guardian is not assigned to the notification student.",
    );
  }
}

export async function getNotificationOutbox(
  schoolId: string,
): Promise<NotificationEvent[]> {
  const selectedSchoolId = schoolId.trim();

  if (!selectedSchoolId) {
    throw new Error("School ID is required.");
  }

  return getPendingNotificationEventsBySchool(
    selectedSchoolId,
  );
}

export async function queueNotificationEvent(
  event: NotificationEvent,
  schoolId: string,
): Promise<NotificationEvent> {
  const selectedSchoolId = schoolId.trim();

  if (!selectedSchoolId) {
    throw new Error("School ID is required.");
  }

  await verifyNotificationOwnership(
    event,
    selectedSchoolId,
  );

  if (
    event.status !== "PENDING" &&
    event.status !== "QUEUED"
  ) {
    throw new Error(
      "Only pending or queued notifications can enter the outbox.",
    );
  }

  const queuedEvent: NotificationEvent = {
    ...event,
    schoolId: selectedSchoolId,
    status: "QUEUED",
    updatedAt: new Date().toISOString(),
  };

  await saveNotificationEvent(queuedEvent);

  return queuedEvent;
}

/**
 * Development-safe processor.
 *
 * This does NOT claim that SMS, WhatsApp or email
 * has actually been delivered. A real provider must
 * be connected before an event can become SENT or
 * DELIVERED.
 */
export async function prepareNotificationOutbox(
  schoolId: string,
): Promise<NotificationEvent[]> {
  const selectedSchoolId = schoolId.trim();

  if (!selectedSchoolId) {
    throw new Error("School ID is required.");
  }

  const pendingEvents =
    await getPendingNotificationEventsBySchool(
      selectedSchoolId,
    );

  const queuedEvents: NotificationEvent[] = [];

  for (const event of pendingEvents) {
    const queuedEvent =
      await queueNotificationEvent(
        event,
        selectedSchoolId,
      );

    queuedEvents.push(queuedEvent);
  }

  return queuedEvents;
}
