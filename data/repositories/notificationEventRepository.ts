import type { NotificationEvent } from "../../domain/entities/notificationEvent";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "notificationEvents";

export async function saveNotificationEvent(
  event: NotificationEvent,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store = transaction.objectStore(
      STORE_NAME,
    );

    store.put(
      event,
      event.notificationId,
    );

    transaction.oncomplete = () => resolve();

    transaction.onerror = () =>
      reject(transaction.error);

    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error("Transaction aborted"),
      );
  });

  db.close();
}

export async function getNotificationEvents(): Promise<
  NotificationEvent[]
> {
  const db = await openDatabase();

  const events =
    await new Promise<NotificationEvent[]>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store =
          transaction.objectStore(
            STORE_NAME,
          );

        const request = store.getAll();

        request.onsuccess = () =>
          resolve(
            request.result as NotificationEvent[],
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return events;
}

export async function getNotificationEventById(
  notificationId: string,
): Promise<NotificationEvent | null> {
  const db = await openDatabase();

  const event =
    await new Promise<NotificationEvent | null>(
      (resolve, reject) => {
        const transaction = db.transaction(
          STORE_NAME,
          "readonly",
        );

        const store =
          transaction.objectStore(
            STORE_NAME,
          );

        const request =
          store.get(notificationId);

        request.onsuccess = () =>
          resolve(
            (request.result as
              | NotificationEvent
              | undefined) ?? null,
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return event;
}

export async function getNotificationEventByIdForSchool(
  notificationId: string,
  schoolId: string,
): Promise<NotificationEvent | null> {
  const event =
    await getNotificationEventById(
      notificationId,
    );

  if (!event) {
    return null;
  }

  if (event.schoolId !== schoolId) {
    return null;
  }

  return event;
}

export async function getNotificationEventsByStudent(
  studentId: string,
): Promise<NotificationEvent[]> {
  const events =
    await getNotificationEvents();

  return events.filter(
    (event) =>
      event.studentId === studentId,
  );
}

export async function getNotificationEventsByStudentAndSchool(
  studentId: string,
  schoolId: string,
): Promise<NotificationEvent[]> {
  const events =
    await getNotificationEventsBySchool(
      schoolId,
    );

  return events.filter(
    (event) =>
      event.studentId === studentId,
  );
}

export async function getNotificationEventsBySchool(
  schoolId: string,
): Promise<NotificationEvent[]> {
  const selectedSchoolId = schoolId.trim();

  if (!selectedSchoolId) {
    return [];
  }

  const events =
    await getNotificationEvents();

  return events.filter(
    (event) =>
      event.schoolId === selectedSchoolId,
  );
}

export async function getPendingNotificationEvents(): Promise<
  NotificationEvent[]
> {
  const events =
    await getNotificationEvents();

  return events.filter(
    (event) =>
      event.status === "PENDING" ||
      event.status === "QUEUED",
  );
}

export async function getPendingNotificationEventsBySchool(
  schoolId: string,
): Promise<NotificationEvent[]> {
  const events =
    await getNotificationEventsBySchool(
      schoolId,
    );

  return events.filter(
    (event) =>
      event.status === "PENDING" ||
      event.status === "QUEUED",
  );
}
