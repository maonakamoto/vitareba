import { getTranslations } from "next-intl/server";
import styles from "./SylClock.module.css";

const DIM_ICONS = ["💚", "🧠", "🤝", "🚀"];

export default async function SylClock() {
  const t = await getTranslations("sylClock");
  const dimensions = t.raw("dimensions") as Array<{ name: string; text: string }>;

  return (
    <section id="longevity" className={styles.section}>
      <div className="section-inner">
        <div className={styles.grid}>
          <div>
            <div className={`eyebrow ${styles.eyebrowDim}`}>
              {t("eyebrow")}
            </div>
            <h2 className="sec-title sec-title-light">
              {t("heading")}
              <br />
              <em>{t("headingEm")}</em>
            </h2>
            <p className={styles.body}>
              {t("body")}
            </p>
          </div>

          <div>
            <div className={styles.dims}>
              {dimensions.map((dim, i) => (
                <div key={dim.name} className={styles.dim}>
                  <div className={styles.dimIcon}>{DIM_ICONS[i]}</div>
                  <div className={styles.dimName}>{dim.name}</div>
                  <div className={styles.dimText}>{dim.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
