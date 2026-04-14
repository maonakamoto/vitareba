import { getTranslations } from "next-intl/server";
import styles from "./Pillars.module.css";

const PILLAR_META = [
  { icon: "🧬", featured: false },
  { icon: "⚡", featured: true },
  { icon: "🍄", featured: false },
];

export default async function Pillars() {
  const t = await getTranslations("pillars");
  const items = t.raw("items") as Array<{
    name: string;
    desc: string;
    tags: string[];
  }>;

  return (
    <section id="pillars" className={styles.section}>
      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">{t("eyebrow")}</div>
        </div>
        <h2 className="sec-title sec-title-center">
          {t("heading")} <em>{t("headingEm")}</em>
        </h2>
        <p className={`sec-sub ${styles.secSub}`}>{t("sub")}</p>
        <div className={styles.grid}>
          {items.map((item, i) => (
            <div
              key={item.name}
              className={`${styles.pillar} ${PILLAR_META[i].featured ? styles.featured : ""}`}
            >
              <div className={styles.icon}>{PILLAR_META[i].icon}</div>
              <div className={styles.name}>{item.name}</div>
              <p className={styles.desc}>{item.desc}</p>
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
