"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/lib/i18n/navigation";
import NextLink from "next/link";
import Logo from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "./Nav.module.css";
import { COMPANY } from "@/lib/config/company";
import { PORTAL_ROUTES } from "@/lib/config/routes";

// Structural config — hrefs only; labels come from translations (nav.mega)
const MEGA_HREFS = {
  programmes: ["#pillars", "#pillars", "#pillars"] as const,
  approach: ["#approach", "#approach", "#approach", "#approach"] as const,
  diagnostics: ["#diagnostics", "#diagnostics", "#diagnostics"] as const,
} as const;

type MegaItem = { label: string; sub?: string };

export default function Nav() {
  const t = useTranslations("nav");
  const mega = t.raw("mega") as {
    programmesFooter: string;
    programmes: MegaItem[];
    approach: string[];
    diagnostics: string[];
  };
  const { data: session } = useSession();

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logoLink} aria-label={`${COMPANY.shortName} — home`}>
        <Logo />
      </Link>

      <div className={styles.navLinks}>
        {/* PROGRAMMES — megamenu */}
        <div className={styles.megaItem}>
          <a href="#pillars" className={styles.megaTrigger}>
            {t("programmes")}
            <svg className={styles.chevron} width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <div className={styles.megaPanel}>
            <div className={styles.megaPanelInner}>
              <div className={styles.megaCards}>
                {mega.programmes.map((item, i) => (
                  <a key={item.label} href={MEGA_HREFS.programmes[i]} className={styles.megaCard}>
                    <span className={styles.megaCardLabel}>{item.label}</span>
                    {item.sub && <span className={styles.megaCardSub}>{item.sub}</span>}
                  </a>
                ))}
              </div>
              <div className={styles.megaPanelFooter}>
                <a href="#pillars" className={styles.megaFooterLink}>{mega.programmesFooter}</a>
              </div>
            </div>
          </div>
        </div>

        {/* APPROACH — megamenu */}
        <div className={styles.megaItem}>
          <a href="#approach" className={styles.megaTrigger}>
            {t("approach")}
            <svg className={styles.chevron} width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <div className={styles.megaPanel}>
            <div className={styles.megaPanelInner}>
              <div className={styles.megaList}>
                {mega.approach.map((label, i) => (
                  <a key={label} href={MEGA_HREFS.approach[i]} className={styles.megaListItem}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DIAGNOSTICS — megamenu */}
        <div className={styles.megaItem}>
          <a href="#diagnostics" className={styles.megaTrigger}>
            {t("diagnostics")}
            <svg className={styles.chevron} width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <div className={styles.megaPanel}>
            <div className={styles.megaPanelInner}>
              <div className={styles.megaList}>
                {mega.diagnostics.map((label, i) => (
                  <a key={label} href={MEGA_HREFS.diagnostics[i]} className={styles.megaListItem}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Simple links */}
        <a href="#longevity" className={styles.navLink}>{t("longevity")}</a>
        <a href="#pricing"   className={styles.navLink}>{t("pricing")}</a>
        <a href="#team"      className={styles.navLink}>{t("team")}</a>
      </div>

      <div className={styles.navActions}>
        <LanguageSwitcher />
        {session ? (
          <NextLink href={PORTAL_ROUTES.dashboard} className={styles.navBtn}>
            {t("dashboard")} &rarr;
          </NextLink>
        ) : (
          <>
            <NextLink href="/login" className={styles.navSignIn}>
              {t("signIn")}
            </NextLink>
            <Link href={PORTAL_ROUTES.assessment} className={styles.navBtn}>
              {t("cta")}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
