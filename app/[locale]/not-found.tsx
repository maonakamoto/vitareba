import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import styles from "../not-found.module.css";

// Locale-aware 404 — German visitors hitting /de/broken-url see German copy
// and a link back to /de (not /dashboard, which the root catch-all uses).
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <div className={styles.page}>
      <p className={styles.title}>{t("title")}</p>
      <p className={styles.body}>{t("body")}</p>
      <Link href="/" className={styles.link}>
        {t("cta")}
      </Link>
    </div>
  );
}
