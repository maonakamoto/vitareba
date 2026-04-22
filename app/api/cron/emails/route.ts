export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailQueue } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email/index";
import {
  assessmentResultsEmail,
  assessmentMeaningEmail,
  assessmentBookingEmail,
  welcomePatientEmail,
  profileCompletionEmail,
  assessmentCtaEmail,
} from "@/lib/email/templates";
import { DIMENSIONS, getVerdict, getInterpretation } from "@/lib/assessment/data";
import { COMPANY, PORTAL_URL } from "@/lib/config/company";
import { EMAIL_TEMPLATE } from "@/lib/config/email-sequences";
import { EMAIL_QUEUE_STATUS } from "@/lib/config/email-queue";
import { requireCron } from "@/lib/auth/guards";

export async function GET(req: Request) {
  const cronError = requireCron(req);
  if (cronError) return cronError;

  const now = new Date();

  const pending = await db.query.emailQueue.findMany({
    where: and(
      eq(emailQueue.status, EMAIL_QUEUE_STATUS.pending),
      lte(emailQueue.sendAt, now)
    ),
    with: { user: { columns: { name: true, email: true } } },
  });

  let sent = 0;
  let failed = 0;

  for (const item of pending) {
    const user = item.user;
    if (!user?.email) {
      await db
        .update(emailQueue)
        .set({ status: EMAIL_QUEUE_STATUS.failed, sentAt: now })
        .where(eq(emailQueue.id, item.id));
      failed++;
      continue;
    }

    const payload = item.payload as Record<string, unknown>;
    const patientName = user.name ?? user.email.split("@")[0];
    const portalUrl = PORTAL_URL;

    try {
      let html: string;
      let subject: string;

      if (item.templateKey === EMAIL_TEMPLATE.assessmentResults) {
        const overallScore = payload.overallScore as number;
        const scores = payload.scores as Record<string, number>;
        const verdict = getVerdict(overallScore);
        const dimensions = DIMENSIONS.map((dim) => ({
          icon: dim.icon,
          name: dim.name,
          score: scores[dim.id] ?? 0,
          interpretation: getInterpretation(dim.id, scores[dim.id] ?? 0),
        }));
        html = assessmentResultsEmail({
          patientName,
          overallScore,
          verdictName: verdict.name,
          verdictText: verdict.text,
          dimensions,
          portalUrl,
        });
        subject = `Your Inflection Edge results — ${verdict.name}`;
      } else if (item.templateKey === EMAIL_TEMPLATE.assessmentMeaning) {
        html = assessmentMeaningEmail({ patientName, portalUrl });
        subject = "What your Inflection Edge profile means clinically";
      } else if (item.templateKey === EMAIL_TEMPLATE.assessmentBooking) {
        const overallScore = payload.overallScore as number;
        html = assessmentBookingEmail({ patientName, overallScore, portalUrl });
        subject = `Book a consultation with ${COMPANY.clinicianName}`;
      } else if (item.templateKey === EMAIL_TEMPLATE.welcomePatient) {
        html = welcomePatientEmail({ patientName, portalUrl });
        subject = `Welcome to ${COMPANY.shortName} — here is where to start`;
      } else if (item.templateKey === EMAIL_TEMPLATE.profileCompletion) {
        html = profileCompletionEmail({ patientName, portalUrl });
        subject = "One thing before your first consultation";
      } else if (item.templateKey === EMAIL_TEMPLATE.assessmentCta) {
        html = assessmentCtaEmail({ patientName, portalUrl });
        subject = "Your Inflection Edge is waiting";
      } else {
        // Unknown template — mark failed, don't retry
        await db
          .update(emailQueue)
          .set({ status: EMAIL_QUEUE_STATUS.failed, sentAt: now })
          .where(eq(emailQueue.id, item.id));
        failed++;
        continue;
      }

      await sendEmail({ to: user.email, subject, html });

      await db
        .update(emailQueue)
        .set({ status: EMAIL_QUEUE_STATUS.sent, sentAt: now })
        .where(eq(emailQueue.id, item.id));
      sent++;
    } catch (err) {
      console.error("[cron/emails] send failed for", item.id, err);
      await db
        .update(emailQueue)
        .set({ status: EMAIL_QUEUE_STATUS.failed, sentAt: now })
        .where(eq(emailQueue.id, item.id));
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    processed: pending.length,
  });
}
