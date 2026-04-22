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

// Megamenu config — sub-items link to on-page anchors
const MEGA = {
  programmes: [
    { label: "ADHD & High Performance", sub: "Decode your neurotype, then optimise it", href: "#pillars" },
    { label: "Metabolic Psychiatry",    sub: "Biology-first approach to mental health",  href: "#pillars" },
    { label: "Psychedelic Readiness",   sub: "Preparation, integration & aftercare",      href: "#pillars" },
  ],
  approach: [
    { label: "Metabolic Assessment",         href: "#approach" },
    { label: "ADHD as Performance System",   href: "#approach" },
    { label: "Psychedelic-assisted Therapy", href: "#approach" },
    { label: "International Patients",       href: "#approach" },
  ],
  diagnostics: [
    { label: "Full Metabolic Workup",      href: "#diagnostics" },
    { label: "Neuropsychological Testing", href: "#diagnostics" },
    { label: "Home Test Kits",             href: "#diagnostics" },
  ],
} as const;

export default function Nav() {
  const t = useTranslations("nav");
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
                {MEGA.programmes.map((item) => (
                  <a key={item.label} href={item.href} className={styles.megaCard}>
                    <span className={styles.megaCardLabel}>{item.label}</span>
                    <span className={styles.megaCardSub}>{item.sub}</span>
                  </a>
                ))}
              </div>
              <div className={styles.megaPanelFooter}>
                <a href="#pillars" className={styles.megaFooterLink}>View all programmes →</a>
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
                {MEGA.approach.map((item) => (
                  <a key={item.label} href={item.href} className={styles.megaListItem}>
                    {item.label}
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
                {MEGA.diagnostics.map((item) => (
                  <a key={item.label} href={item.href} className={styles.megaListItem}>
                    {item.label}
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
