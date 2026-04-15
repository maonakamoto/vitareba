import styles from "@/app/(admin)/admin.module.css";
import { DIMENSIONS, INTERPRETATIONS, VERDICT_TIERS, scoreColor } from "@/lib/assessment/data";
import { formatDateShort } from "@/lib/utils/format";

type AssessmentResult = {
  id: string;
  overallScore: number;
  scores: unknown;
  completedAt: Date;
};

function getVerdict(score: number) {
  return VERDICT_TIERS.find((t) => score >= t.minScore && score <= t.maxScore);
}

function getInterpretation(dimId: string, score: number): string {
  const tiers = INTERPRETATIONS[dimId as keyof typeof INTERPRETATIONS];
  if (!tiers) return "";
  return tiers.find((t) => score <= t.maxScore)?.text ?? tiers[tiers.length - 1].text;
}

export function PatientAssessmentCard({ assessmentResults }: { assessmentResults: AssessmentResult[] }) {
  const result = assessmentResults[0];
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>
        Latest Assessment {assessmentResults.length > 1 && `(${assessmentResults.length} total)`}
      </p>
      {!result ? (
        <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No assessments yet.</div>
      ) : (() => {
        const scores = result.scores as Record<string, number>;
        const verdict = getVerdict(result.overallScore);
        return (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.35rem" }}>
              <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "3rem", fontWeight: 300, color: scoreColor(result.overallScore), lineHeight: 1 }}>
                {result.overallScore}
              </span>
              <div>
                {verdict && <div style={{ fontSize: "0.82rem", color: "var(--ink)", fontWeight: 400 }}>{verdict.name}</div>}
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{formatDateShort(result.completedAt)}</div>
              </div>
            </div>
            {verdict && (
              <p style={{ fontSize: "0.78rem", color: "var(--ink2)", lineHeight: 1.65, marginBottom: "1rem" }}>
                {verdict.text}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {DIMENSIONS.map((dim) => {
                const score = scores[dim.id] ?? 0;
                return (
                  <div key={dim.id} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>{dim.icon}</div>
                    <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", fontWeight: 300, color: scoreColor(score), lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: "0.55rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.15rem" }}>{dim.name}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {DIMENSIONS.map((dim) => {
                const score = scores[dim.id] ?? 0;
                return (
                  <div key={dim.id} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: scoreColor(score), minWidth: "28px" }}>{score}</span>
                    <p style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                      <strong style={{ color: "var(--ink2)", fontWeight: 500 }}>{dim.name}:</strong>{" "}
                      {getInterpretation(dim.id, score)}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
}
