import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      {/* ── Left: brand panel ── */}
      <div className={styles.brand}>
        <Link href="/" className={styles.brandLogo} aria-label="VitaReBa — home">
          <span className={styles.brandName}>Vita<em>Re</em>Ba</span>
        </Link>
        <div className={styles.brandBody}>
          <p className={styles.brandEyebrow}>Patient portal</p>
          <h1 className={styles.brandHeadline}>
            Clarity begins<br />with <em>data.</em>
          </h1>
          <p className={styles.brandSub}>
            Your Inflection Edge scores, consultation history, and care — in one private place.
          </p>
        </div>
        <p className={styles.brandFooter}>
          Metabolic Psychiatry &amp; Systemic Longevity · Zürich
        </p>
      </div>

      {/* ── Right: form panel ── */}
      <div className={styles.formPanel}>
        <div className={styles.formInner}>
          {children}
        </div>
      </div>
    </div>
  );
}
