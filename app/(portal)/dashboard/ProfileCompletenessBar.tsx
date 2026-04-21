import Link from "next/link";
import styles from "../portal.module.css";
import { profileCompletenessColor } from "@/lib/domain/profile";

export function ProfileCompletenessBar({ pct }: { pct: number }) {
  if (pct >= 100) return null;
  return (
    <div className={styles.card} style={{ padding: "1.25rem 1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
        <p className={styles.cardTitle} style={{ margin: 0 }}>Intake profile</p>
        <span style={{ fontSize: "0.82rem", fontWeight: 400, color: profileCompletenessColor(pct) }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: "4px", borderRadius: "2px", background: "var(--light)", marginBottom: "0.75rem" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: "2px", background: "var(--teal)", transition: "width 0.3s ease" }} />
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--ink2)", margin: 0 }}>
        {pct < 40
          ? "A full profile lets Manuel arrive at your consultation already knowing your context — not spending the first 20 minutes gathering basics."
          : pct < 80
          ? "Almost there — a complete profile means Manuel can design your programme before you even walk in the door."
          : "Just a few fields left — complete your profile so Manuel has the full picture."}
        {" "}
        <Link href="/profile" style={{ color: "var(--teal)", textDecoration: "none" }}>
          Complete profile →
        </Link>
      </p>
    </div>
  );
}
