import { getTranslations } from "next-intl/server";
import styles from "./Diagnostics.module.css";

export default async function Diagnostics() {
  const t = await getTranslations("diagnostics");
  const categories = t.raw("categories") as Array<{
    cat: string;
    items: string[];
  }>;

  return (
    <section id="diagnostics" className={styles.section}>
      <div className="section-inner">
        <div className={styles.intro}>
          <div>
            <div className="eyebrow">{t("eyebrow")}</div>
            <h2 className="sec-title">
              {t("heading")}
              <br />
              {t("headingLine2")}
              <br />
              <em>{t("headingEm")}</em>
            </h2>
          </div>
          <div>
            <p className="sec-sub">{t("sub")}</p>
          </div>
        </div>

        <div className={styles.grid}>
          {categories.map((category) => (
            <div key={category.cat} className={styles.dc}>
              <div className={styles.cat}>{category.cat}</div>
              {category.items.map((item) => (
                <div key={item} className={styles.item}>
                  <div className={styles.dot} />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
