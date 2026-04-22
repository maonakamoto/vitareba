import Link from "next/link";
import styles from "./dashboard.module.css";
import { profileCompletenessColor } from "@/lib/domain/profile";
import { COMPANY } from "@/lib/config/company";
import { PROFILE_COMPLETENESS_LOW_PCT, PROFILE_COMPLETENESS_HIGH_PCT } from "@/lib/config/portal";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export function ProfileCompletenessBar({ pct }: { pct: number }) {
  if (pct >= 100) return null;
  return (
    <div className={styles.profileBar}>
      <div className={styles.profileBarHeader}>
        <p className={styles.profileBarTitle}>Intake profile</p>
        <span className={styles.profileBarPct} style={{ color: profileCompletenessColor(pct) }}>
          {pct}%
        </span>
      </div>
      <div className={styles.profileBarTrack}>
        <div className={styles.profileBarFill} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.profileBarText}>
        {pct < PROFILE_COMPLETENESS_LOW_PCT
          ? `A full profile lets ${COMPANY.clinicianName} arrive at your consultation already knowing your context — not spending the first 20 minutes gathering basics.`
          : pct < PROFILE_COMPLETENESS_HIGH_PCT
          ? `Almost there — a complete profile means ${COMPANY.clinicianName} can design your programme before you even walk in the door.`
          : `Just a few fields left — complete your profile so ${COMPANY.clinicianName} has the full picture.`}
        {" "}
        <Link href={PORTAL_ROUTES.profile} className={styles.profileBarLink}>
          Complete profile →
        </Link>
      </p>
    </div>
  );
}
