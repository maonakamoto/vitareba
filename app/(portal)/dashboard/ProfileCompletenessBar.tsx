import Link from "next/link";
import styles from "./dashboard.module.css";
import { profileCompletenessColor } from "@/lib/domain/profile";

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
        {pct < 40
          ? "A full profile lets Manuel arrive at your consultation already knowing your context — not spending the first 20 minutes gathering basics."
          : pct < 80
          ? "Almost there — a complete profile means Manuel can design your programme before you even walk in the door."
          : "Just a few fields left — complete your profile so Manuel has the full picture."}
        {" "}
        <Link href="/profile" className={styles.profileBarLink}>
          Complete profile →
        </Link>
      </p>
    </div>
  );
}
