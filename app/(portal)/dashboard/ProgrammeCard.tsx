import { PROGRAMME_CONFIG, PHASE_CONFIG } from "@/lib/config/programmes";
import type { ProgrammeKey, PhaseKey } from "@/lib/config/programmes";
import shared from "../portal.module.css";
import styles from "./dashboard.module.css";

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
    <div className={shared.card}>
      <p className={shared.cardTitle}>Your Programme</p>
      <p className={styles.progName}>{prog.label}</p>
      <p className={styles.progPhase}>{ph.label}</p>
      <p className={styles.progDesc}>{ph.description}</p>
    </div>
  );
}
