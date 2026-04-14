import Link from "next/link";
import { COMPANY } from "@/lib/config/company";
import styles from "./Cta.module.css";

export default function Cta() {
  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>Begin Here</div>
      <div className={styles.title}>
        Your ocean.
        <br />
        <em>Precisely mapped.</em>
      </div>
      <p className={styles.sub}>
        Start with the Inflection Edge — our free ADHD performance assessment.
        In 8 minutes you will have the most precise picture of your neurotype
        you have ever seen. Your results are your Epoch — the beginning of a
        new chapter.
      </p>
      <div className={styles.btns}>
        <Link href="/assessment" className={styles.btnPrimary}>
          Take the Inflection Edge →
        </Link>
        <a
          href={`mailto:${COMPANY.email}`}
          className={styles.btnOutline}
        >
          Book a Discovery Call
        </a>
      </div>
      <p className={styles.note}>
        {COMPANY.name} · {COMPANY.address.street} · {COMPANY.address.zip}{" "}
        {COMPANY.address.city} · {COMPANY.email}
      </p>
    </div>
  );
}
