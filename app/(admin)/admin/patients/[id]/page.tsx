import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, documents, threads, threadMessages, dailyCheckins, patientNotes, programmeAssignments } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import Link from "next/link";
import styles from "../../../admin.module.css";
import { DocumentAddForm } from "@/components/admin/DocumentAddForm";
import { AdminNotesForm } from "@/components/admin/AdminNotesForm";
import { ProgrammeAssignmentForm } from "@/components/admin/ProgrammeAssignmentForm";
import { CheckinTrendChart } from "@/components/portal/CheckinTrendChart";
import { AssessmentTrendChart } from "@/components/portal/AssessmentTrendChart";
import { PatientProfileCard } from "@/components/admin/PatientProfileCard";
import { PatientAssessmentCard } from "@/components/admin/PatientAssessmentCard";
import { PatientBookingsCard } from "@/components/admin/PatientBookingsCard";
import { PatientMessagesCard } from "@/components/admin/PatientMessagesCard";
import { PatientGoalsCard } from "@/components/admin/PatientGoalsCard";
import { formatDateShort, formatDateLong } from "@/lib/utils/format";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const { id } = await params;

  const patient = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      profile: true,
      assessmentResults: { orderBy: [desc(assessmentResults.completedAt)] },
      bookings: { orderBy: [desc(bookings.createdAt)] },
      documents: { orderBy: [desc(documents.createdAt)] },
      threads: {
        orderBy: [desc(threads.lastMessageAt)],
        with: {
          messages: { orderBy: [desc(threadMessages.createdAt)], limit: 1 },
        },
      },
      dailyCheckins: { orderBy: [asc(dailyCheckins.date)] },
      patientNotes: {
        orderBy: [desc(patientNotes.createdAt)],
        with: { admin: { columns: { name: true } } },
      },
      programmeAssignment: true,
    },
  });

  if (!patient || patient.role !== "patient") notFound();

  return (
    <div>
      {/* Header */}
      <div className={styles.patientHeader}>
        <Link href="/admin/patients" className={styles.patientBackLink}>
          ← All patients
        </Link>
        <div className={styles.patientHeaderRow}>
          <div>
            <h1 className={styles.pageTitle}>
              {patient.name ? <em>{patient.name}</em> : <span className={styles.patientNameMuted}>Unnamed patient</span>}
            </h1>
            <p className={styles.pageSub}>{patient.email} · registered {formatDateLong(patient.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* 2-column card grid */}
      <div className={styles.patientGrid}>
        <PatientProfileCard profile={patient.profile} />
        <PatientAssessmentCard assessmentResults={patient.assessmentResults} />
        <PatientBookingsCard bookings={patient.bookings} />
        <PatientMessagesCard threads={patient.threads} patientId={patient.id} />
      </div>

      {/* Check-in trend */}
      {patient.dailyCheckins.length > 0 && (
        <div className={styles.cardWithTopMargin}>
          <p className={styles.cardLabel}>Check-in trend</p>
          <CheckinTrendChart
            data={patient.dailyCheckins.map((c) => ({
              date: c.date.slice(5),
              sleep: c.sleep,
              energy: c.energy,
              mood: c.mood,
              focus: c.focus,
              stress: c.stress,
            }))}
          />
        </div>
      )}

      {/* Assessment trend */}
      {patient.assessmentResults.length >= 2 && (
        <div className={styles.cardWithTopMargin}>
          <p className={styles.cardLabel}>Assessment trend</p>
          <AssessmentTrendChart
            data={patient.assessmentResults.map((r) => ({
              date: new Date(r.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
              score: r.overallScore,
            }))}
          />
        </div>
      )}

      {/* Programme assignment */}
      <div className={styles.cardWithTopMargin}>
        <p className={styles.cardLabel}>Programme assignment</p>
        <ProgrammeAssignmentForm
          patientId={patient.id}
          initial={patient.programmeAssignment ? {
            programme: patient.programmeAssignment.programme,
            phase: patient.programmeAssignment.phase,
            startDate: patient.programmeAssignment.startDate ?? null,
            notes: patient.programmeAssignment.notes ?? null,
          } : null}
        />
      </div>

      {/* Documents */}
      <div className={styles.cardWithTopMargin}>
        <p className={styles.cardLabel}>Documents ({patient.documents.length})</p>
        {patient.documents.length > 0 && (
          <div className={styles.docList}>
            {patient.documents.map((doc) => (
              <div key={doc.id} className={styles.docRow}>
                <div>
                  <div className={styles.docTitle}>{doc.title}</div>
                  <div className={styles.docMeta}>
                    {formatDateShort(doc.createdAt)}
                    {doc.mimeType && ` · ${doc.mimeType}`}
                  </div>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                  Open →
                </a>
              </div>
            ))}
          </div>
        )}
        <DocumentAddForm patientId={patient.id} />
      </div>

      {/* Clinical goals */}
      <PatientGoalsCard patientId={patient.id} />

      {/* Clinical notes */}
      <div className={styles.cardWithTopMargin}>
        <p className={styles.cardLabel}>Clinical notes</p>
        <AdminNotesForm
          patientId={patient.id}
          initialNotes={patient.patientNotes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt.toISOString(),
            adminName: n.admin?.name ?? null,
          }))}
        />
      </div>
    </div>
  );
}
