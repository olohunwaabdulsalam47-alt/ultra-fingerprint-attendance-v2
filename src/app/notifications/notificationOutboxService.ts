import type { NotificationEvent } from "../../../domain/entities/notificationEvent";
import {
  getPendingNotificationEvents,
  saveNotificationEvent,
} from "../../../data/repositories/notificationEventRepository";

export async function getNotificationOutbox(): Promise<
  NotificationEvent[]
> {
  return getPendingNotificationEvents();
}

export async function queueNotificationEvent(
  event: NotificationEvent,
): Promise<NotificationEvent> {
  const queuedEvent: NotificationEvent = {
    ...event,
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
export async function prepareNotificationOutbox(): Promise<
  NotificationEvent[]
> {
  const pendingEvents =
    await getPendingNotificationEvents();

  const queuedEvents: NotificationEvent[] = [];

  for (const event of pendingEvents) {
    const queuedEvent =
      await queueNotificationEvent(event);

    queuedEvents.push(queuedEvent);
  }

  return queuedEvents;
}
