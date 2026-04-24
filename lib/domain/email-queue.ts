import { db } from "@/lib/db";
import { emailQueue } from "@/lib/db/schema";
import { ASSESSMENT_EMAIL_SEQUENCE, WELCOME_EMAIL_SEQUENCE } from "@/lib/config/email-sequences";

export async function enqueueAssessmentEmails({
  userId,
  overallScore,
  scores,
  triggeredAt,
  isFirstAssessment = true,
}: {
  userId: string;
  overallScore: number;
  scores: Record<string, number>;
  triggeredAt: Date;
  /** When false (retake), only the immediate results email is enqueued — the nurture
   *  sequence (assessmentMeaning +48h, assessmentBooking +5d) fires only on first completion. */
  isFirstAssessment?: boolean;
}) {
  const sequence = isFirstAssessment
    ? ASSESSMENT_EMAIL_SEQUENCE
    : ASSESSMENT_EMAIL_SEQUENCE.filter((step) => step.delayMs === 0);

  const rows = sequence.map((step) => ({
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
