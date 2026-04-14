import Logo from "@/components/Logo";
import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Link href="/" className={styles.logoLink} aria-label="VitaReBa — home">
        <Logo />
      </Link>
      <main className={styles.card}>{children}</main>
      <p className={styles.footer}>
        Metabolic Psychiatry &amp; Systemic Longevity · Zürich
      </p>
    </div>
  );
}
