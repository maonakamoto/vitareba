import { COMPANY } from "@/lib/config/company";
import Logo from "@/components/Logo";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Logo variant="light" tagline="Surf Your Life" small />
      <div className={styles.legal}>
        © {COMPANY.foundingYear} {COMPANY.name} · All psychedelic therapies
        within Swiss regulatory frameworks
      </div>
    </footer>
  );
}
