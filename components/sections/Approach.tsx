import { getTranslations } from "next-intl/server";
import styles from "./Approach.module.css";

const ITEM_NUMBERS = ["01", "02", "03", "04"];

export default async function Approach() {
  const t = await getTranslations("approach");
  const items = t.raw("items") as Array<{ title: string; body: string }>;

  return (
    <section id="approach" className={styles.section}>
      <div className="section-inner">
        <div className={styles.grid}>
          <div className={styles.sticky}>
            <div className="eyebrow">{t("eyebrow")}</div>
            <h2 className="sec-title">
              {t("heading")}
              <br />
              {t("headingEm").startsWith("and ") ? (
                <>
                  and <em>{t("headingEm").replace("and ", "")}</em>
                </>
              ) : (
                <em>{t("headingEm")}</em>
              )}
            </h2>
            <p className="sec-sub sec-sub-mt">{t("sub")}</p>
          </div>
          <div className={styles.items}>
            {items.map((item, i) => (
              <div key={ITEM_NUMBERS[i]} className={styles.item}>
                <div className={styles.itemN}>{ITEM_NUMBERS[i]}</div>
                <div className={styles.itemTitle}>{item.title}</div>
                <p className={styles.itemBody}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
