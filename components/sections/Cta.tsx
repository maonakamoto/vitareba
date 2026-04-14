import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { COMPANY } from "@/lib/config/company";
import styles from "./Cta.module.css";

export default async function Cta() {
  const t = await getTranslations("cta");

  return (
    <div className={styles.section}>
      <div className={styles.eyebrow}>{t("eyebrow")}</div>
      <div className={styles.title}>
        {t("heading")}
        <br />
        <em>{t("headingEm")}</em>
      </div>
      <p className={styles.sub}>
        {t("sub")}
      </p>
      <div className={styles.btns}>
        <Link href="/assessment" className={styles.btnPrimary}>
          {t("ctaPrimary")}
        </Link>
        <a
          href={`mailto:${COMPANY.email}`}
          className={styles.btnOutline}
        >
          {t("ctaSecondary")}
        </a>
      </div>
      <p className={styles.note}>
        {COMPANY.name} · {COMPANY.address.street} · {COMPANY.address.zip}{" "}
        {COMPANY.address.city} · {COMPANY.email}
      </p>
    </div>
  );
}
