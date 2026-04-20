"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/lib/i18n/navigation";
import Logo from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "./Nav.module.css";

const NAV_LINK_KEYS = [
  { key: "programmes", href: "#pillars" },
  { key: "approach", href: "#approach" },
  { key: "diagnostics", href: "#diagnostics" },
  { key: "longevity", href: "#longevity" },
  { key: "pricing", href: "#pricing" },
  { key: "team", href: "#team" },
] as const;

export default function Nav() {
  const t = useTranslations("nav");
  const { data: session } = useSession();

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logoLink} aria-label="VitaReBa — home">
        <Logo />
      </Link>
      <div className={styles.navLinks}>
        {NAV_LINK_KEYS.map(({ key, href }) => (
          <a key={key} href={href}>
            {t(key)}
          </a>
        ))}
      </div>
      <div className={styles.navActions}>
        <LanguageSwitcher />
        {session ? (
          // Portal routes are not locale-prefixed — use plain <a>, not i18n Link
          <a href="/dashboard" className={styles.navBtn}>
            {t("dashboard")} &rarr;
          </a>
        ) : (
          <>
            <a href="/login" className={styles.navSignIn}>
              {t("signIn")}
            </a>
            <Link href="/assessment" className={styles.navBtn}>
              {t("cta")}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
