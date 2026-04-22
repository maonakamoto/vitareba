import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { COMPANY } from "@/lib/config/company";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import styles from "./Hero.module.css";

export default async function Hero() {
  const t = await getTranslations("hero");
  const specialties = t.raw("specialties") as string[];

  return (
    <div className={styles.hero}>
      <div className={styles.heroL}>
        <div className={styles.eyebrow}>{t("eyebrow")}</div>
        <h1 className={styles.title}>
          {t("titleLine1")}
          <br />
          {t("titleLine2")}
          <br />
          <em>{t("titleEm")}</em>
        </h1>
        <p className={styles.sub}>{t("sub")}</p>
        <div className={styles.pills}>
          {specialties.map((pill) => (
            <span key={pill} className={styles.pill}>
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.heroR}>
        <div className={styles.rightEyebrow}>{t("flagship")}</div>
        <div className={styles.rightTitle}>
          {t("flagshipTitle")}
          <br />
          <em>{t("flagshipTitleEm")}</em>
        </div>
        <p className={styles.rightSub}>{t("flagshipSub")}</p>
        <div className={styles.quoteBar}>&ldquo;{t("quote")}&rdquo;</div>
        <div className={styles.btns}>
          <Link href={PORTAL_ROUTES.assessment} className={styles.btnDark}>
            {t("ctaPrimary")}
          </Link>
          <a href={`mailto:${COMPANY.email}`} className={styles.btnOutline}>
            {t("ctaSecondary")}
          </a>
        </div>
      </div>
    </div>
  );
}
