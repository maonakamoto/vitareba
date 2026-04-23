import { getTranslations } from "next-intl/server";
import styles from "./Pathway.module.css";

export default async function Pathway() {
  const t = await getTranslations("pathway");
  const steps = t.raw("steps") as Array<{
    sub: string;
    title: string;
    text: string;
    tags: string[];
  }>;

  return (
    <section className={styles.section}>
      <div className="section-inner">
        <div className="section-header">
          <div className="eyebrow">{t("eyebrow")}</div>
        </div>
        <h2 className="sec-title sec-title-center">
          {t("heading")} <em>{t("headingEm")}</em>
        </h2>
        <div className={styles.grid}>
          {steps.map((step, i) => (
            <div key={step.title} className={styles.card}>
              <div className={styles.n}>{i + 1}</div>
              <div className={styles.sub}>{step.sub}</div>
              <div className={styles.title}>{step.title}</div>
              <p className={styles.text}>{step.text}</p>
              <div className="tags">
                {step.tags.map((tag) => (
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
