import { getTranslations } from "next-intl/server";
import styles from "./ImpactStats.module.css";

const STATS_CONFIG = [
  { number: "13", unit: " yrs" },
  { number: "4×", unit: "" },
  { number: "40", unit: "%" },
  { number: "#1", unit: "" },
];

export default async function ImpactStats() {
  const t = await getTranslations("impactStats");
  const stats = t.raw("stats") as Array<{ label: string; source: string }>;

  return (
    <section className={styles.section}>
      <div className="section-inner">
        <div className={styles.header}>
          <div className={`eyebrow ${styles.eyebrowDim}`}>{t("eyebrow")}</div>
        </div>
        <h2 className={`sec-title ${styles.secTitle}`}>
          {t("heading")}
          <br />
          <em>{t("headingEm")}</em>
        </h2>

        <div className={styles.grid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.n}>
                {STATS_CONFIG[i].number}
                {STATS_CONFIG[i].unit && (
                  <span className={styles.unit}>{STATS_CONFIG[i].unit}</span>
                )}
              </div>
              <div className={styles.label}>{stat.label}</div>
              <div className={styles.source}>{stat.source}</div>
            </div>
          ))}
        </div>

        <div className={styles.text}>
          <p>{t("body")}</p>
        </div>
      </div>
    </section>
  );
}
