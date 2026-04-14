import Link from "next/link";
import { COMPANY } from "@/lib/config/company";
import styles from "./Hero.module.css";

const SPECIALTIES = [
  "ADHD",
  "Longevity",
  "Addiction",
  "Burnout",
  "High Performance",
  "Psychedelic Therapy",
] as const;

export default function Hero() {
  return (
    <div className={styles.hero}>
      <div className={styles.heroL}>
        <div className={styles.eyebrow}>
          Zürich · 8008 · International Patients Welcome
        </div>
        <h1 className={styles.title}>
          Metabolic
          <br />
          Psychiatry &<br />
          <em>Systemic Longevity.</em>
        </h1>
        <p className={styles.sub}>
          We go beyond diagnosis. We decode the biology behind your mind — and
          the environment around it — to design a personalised path to sustained
          high performance, longevity and wellbeing.
        </p>
        <div className={styles.pills}>
          {SPECIALTIES.map((pill) => (
            <span key={pill} className={styles.pill}>
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.heroR}>
        <div className={styles.rightEyebrow}>Our Flagship Programme</div>
        <div className={styles.rightTitle}>
          ADHD & the
          <br />
          <em>High-Performing Mind</em>
        </div>
        <p className={styles.rightSub}>
          A world-first integrated programme combining formal ADHD diagnostics,
          metabolic medicine, longevity technologies, psychedelic-state
          therapies and personalised Surf Your Life performance coaching.
        </p>
        <div className={styles.quoteBar}>
          &ldquo;The ADHD brain is not a broken lake that needs calming. It is a
          powerful ocean — and you were never taught to surf it.&rdquo;
        </div>
        <div className={styles.btns}>
          <Link href="/assessment" className={styles.btnDark}>
            Take the Inflection Edge →
          </Link>
          <a href={`mailto:${COMPANY.email}`} className={styles.btnOutline}>
            Book Consultation
          </a>
        </div>
      </div>
    </div>
  );
}
