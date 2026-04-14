"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { routing } from "@/i18n/routing";
import styles from "./LanguageSwitcher.module.css";

const LOCALE_LABELS: Record<string, string> = {
  de: "DE",
  fr: "FR",
  it: "IT",
  en: "EN",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={styles.root}>
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          className={`${styles.btn} ${l === locale ? styles.active : ""}`}
          onClick={() => router.replace(pathname, { locale: l })}
          aria-label={`Switch to ${LOCALE_LABELS[l]}`}
          aria-current={l === locale ? "true" : undefined}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
