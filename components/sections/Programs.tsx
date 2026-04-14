import { getTranslations } from "next-intl/server";
import { COMPANY } from "@/lib/config/company";
import styles from "./Programs.module.css";

const PROGRAM_META = [
  { name: "Edge Diagnostic", price: "CHF 2,400", featured: false, btnStyle: "outline" as const },
  { name: "Riding the Wave", price: "CHF 8,500", featured: true, btnStyle: "primary" as const },
  { name: "Full Ocean", price: "CHF 18,000", featured: false, btnStyle: "outline" as const },
];

export default async function Programs() {
  const t = await getTranslations("programs");
  const items = t.raw("items") as Array<{
    note: string;
    desc: string;
    badge: string | null;
    btnLabel: string;
    features: string[];
  }>;

  return (
    <section id="pricing" className={styles.section}>
      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">{t("eyebrow")}</div>
        </div>
        <h2 className="sec-title sec-title-center">
          {t("heading")} <em>{t("headingEm")}</em>
        </h2>

        <div className={styles.grid}>
          {PROGRAM_META.map((meta, i) => {
            const prog = items[i];
            return (
              <div
                key={meta.name}
                className={`${styles.prog} ${meta.featured ? styles.featured : ""}`}
              >
                {prog.badge && <div className={styles.badge}>{prog.badge}</div>}
                <div className={`${styles.name}${meta.featured ? ` ${styles.nameFeatured}` : ""}`}>
                  {meta.name}
                </div>
                <div className={styles.price}>{meta.price}</div>
                <div className={styles.note}>{prog.note}</div>
                <p className={styles.desc}>{prog.desc}</p>
                {prog.features.map((feature) => (
                  <div key={feature} className={styles.item}>
                    <span className={styles.check}>✦</span>
                    {feature}
                  </div>
                ))}
                <a
                  href={`mailto:${COMPANY.email}`}
                  className={`${styles.btn} ${
                    meta.btnStyle === "primary" ? styles.btnPrimary : styles.btnOutline
                  }`}
                >
                  {prog.btnLabel}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
