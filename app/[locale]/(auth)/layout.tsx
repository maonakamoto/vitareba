import { Link } from "@/lib/i18n/navigation";
import Logo from "@/components/Logo";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logoWrap} aria-label="VitaReBa — home">
          <Logo />
        </Link>
        {children}
      </div>
      <p className={styles.pageFooter}>
        Metabolic Psychiatry &amp; Systemic Longevity · Zürich
      </p>
    </div>
  );
}
