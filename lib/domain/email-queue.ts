import { db } from "@/lib/db";
import { emailQueue } from "@/lib/db/schema";
import { ASSESSMENT_EMAIL_SEQUENCE, WELCOME_EMAIL_SEQUENCE } from "@/lib/config/email-sequences";

export async function enqueueAssessmentEmails({
  userId,
  overallScore,
  scores,
  triggeredAt,
}: {
  userId: string;
  overallScore: number;
  scores: Record<string, number>;
  triggeredAt: Date;
}) {
  const rows = ASSESSMENT_EMAIL_SEQUENCE.map((step) => ({
    userId,
    templateKey: step.templateKey,
    sendAt: new Date(triggeredAt.getTime() + step.delayMs),
    payload: { overallScore, scores } as Record<string, unknown>,
  }));

  await db.insert(emailQueue).values(rows);
}

export async function enqueueWelcomeEmails({
  userId,
  triggeredAt,
}: {
  userId: string;
  triggeredAt: Date;
}) {
  const rows = WELCOME_EMAIL_SEQUENCE.map((step) => ({
    userId,
    templateKey: step.templateKey,
    sendAt: new Date(triggeredAt.getTime() + step.delayMs),
    payload: {} as Record<string, unknown>,
  }));

  await db.insert(emailQueue).values(rows);
}
