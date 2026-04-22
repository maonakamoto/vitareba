// Message/thread type definitions — SSOT for API-serialised shapes used across portal and admin

/** A single message within a thread (API serialised — dates are strings) */
export type MessageRow = {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; name: string | null; role: string };
};

/**
 * Thread list item returned by GET /api/messages.
 * Includes a preview of the latest message (body + readAt) for unread indicators.
 */
export type ThreadListItem = {
  id: string;
  subject: string;
  createdAt: string;
  lastMessageAt: string;
  patient: { id: string };
  messages: { body: string; senderId: string; readAt: string | null }[];
};

/** Full thread with messages, returned by GET /api/messages/[id] (portal view) */
export type ThreadDetail = {
  id: string;
  subject: string;
  messages: MessageRow[];
};

/** ThreadDetail with patient info — admin-only endpoints include this extra field */
export type ThreadDetailWithPatient = ThreadDetail & {
  patient: { id: string; name: string | null; email: string };
};
