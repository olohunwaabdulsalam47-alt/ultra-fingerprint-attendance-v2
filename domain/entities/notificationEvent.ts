export type NotificationChannel =
  | "SMS"
  | "WHATSAPP"
  | "EMAIL";

export type NotificationEventType =
  | "ATTENDANCE_PRESENT"
  | "ATTENDANCE_LATE"
  | "ATTENDANCE_ABSENT"
  | "GENERAL";

export type NotificationStatus =
  | "PENDING"
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "FAILED";

export interface NotificationEvent {
  notificationId: string;
  schoolId: string;
  studentId: string;
  guardianId: string;
  channel: NotificationChannel;
  type: NotificationEventType;
  recipient: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
}
