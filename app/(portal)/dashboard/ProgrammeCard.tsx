import { PROGRAMME_CONFIG, PHASE_CONFIG } from "@/lib/config/programmes";
import type { ProgrammeKey, PhaseKey } from "@/lib/config/programmes";
import styles from "../portal.module.css";

export function ProgrammeCard({
  programme,
  phase,
}: {
  programme: ProgrammeKey;
  phase: PhaseKey;
}) {
  const prog = PROGRAMME_CONFIG[programme];
  const ph = PHASE_CONFIG[phase];

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>Your Programme</p>
      <p
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "1.6rem",
          fontWeight: 300,
          color: "var(--ink)",
          margin: "0 0 0.25rem",
        }}
      >
        {prog.label}
      </p>
      <p
        style={{
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--teal)",
          marginBottom: "0.75rem",
        }}
      >
        {ph.label}
      </p>
      <p
        style={{
          fontSize: "0.82rem",
          color: "var(--ink2)",
          lineHeight: 1.65,
        }}
      >
        {ph.description}
      </p>
    </div>
  );
}
