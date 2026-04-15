import { db } from "@/lib/db";
import { threads, threadMessages, users } from "@/lib/db/schema";
import { eq, and, isNull, ne, inArray } from "drizzle-orm";

/**
 * Count threads that have at least one unread message for the given user.
 * "Unread" = message not sent by this user and readAt IS NULL.
 */
export async function getUnreadThreadCount(userId: string): Promise<number> {
  // Get all thread IDs relevant to this user
  const userThreads = await db.query.threads.findMany({
    where: eq(threads.patientId, userId),
    columns: { id: true },
  });

  if (userThreads.length === 0) return 0;

  const threadIds = userThreads.map((t) => t.id);

  const unread = await db.query.threadMessages.findMany({
    where: and(
      inArray(threadMessages.threadId, threadIds),
      ne(threadMessages.senderId, userId),
      isNull(threadMessages.readAt)
    ),
    columns: { threadId: true },
  });

  // Count distinct threads
  return new Set(unread.map((m) => m.threadId)).size;
}

/**
 * Count threads (across all patients) that have at least one unread message
 * sent by a patient (non-admin). Used for the admin nav badge.
 */
export async function getAdminUnreadThreadCount(): Promise<number> {
  // Find all patient user IDs
  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
    columns: { id: true },
  });

  if (patients.length === 0) return 0;

  const patientIds = patients.map((p) => p.id);

  const unread = await db.query.threadMessages.findMany({
    where: and(
      inArray(threadMessages.senderId, patientIds),
      isNull(threadMessages.readAt)
    ),
    columns: { threadId: true },
  });

  return new Set(unread.map((m) => m.threadId)).size;
}
