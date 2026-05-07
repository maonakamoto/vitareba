import Link from "next/link";
import styles from "./dashboard.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { COMPANY } from "@/lib/config/company";

export function OnboardingCard() {
  return (
    <div className={styles.heroCard}>
      <p className={styles.heroEyebrow}>Start here</p>
      <p className={styles.heroTitle}>Understand your neurotype in 10 minutes</p>
      <p className={styles.ctaBody}>
        The Inflection Edge maps your ADHD profile across five dimensions: Arousal, Divergent Output,
        Hyperfocus, Volatility, and Environment Design. Your results are the clinical foundation for
        everything that follows — {COMPANY.clinicianName} reviews them before every consultation.
      </p>
      <p className={styles.ctaBodySpaced}>
        Most patients describe this as the first time they&apos;ve seen their performance pattern
        explained clearly. Take 10 minutes now.
      </p>
      <Link href={PORTAL_ROUTES.assessment} className={`btn-dark ${styles.ctaBtnLarge}`}>
        Take the Inflection Edge →
      </Link>
    </div>
  );
}
