/** Email queue status values — SSOT, mirrors pgEnum("email_queue_status") in schema */
export const EMAIL_QUEUE_STATUS_VALUES = ["pending", "sent", "failed"] as const;
export type EmailQueueStatus = (typeof EMAIL_QUEUE_STATUS_VALUES)[number];

/** Named constants for email queue status — use in DB queries instead of string literals */
export const EMAIL_QUEUE_STATUS = {
  pending: "pending",
  sent: "sent",
  failed: "failed",
} as const satisfies Record<EmailQueueStatus, EmailQueueStatus>;
