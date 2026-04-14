"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./Nav.module.css";

const NAV_LINKS = [
  { href: "#pillars", label: "Programmes" },
  { href: "#approach", label: "Approach" },
  { href: "#diagnostics", label: "Diagnostics" },
  { href: "#longevity", label: "Longevity" },
  { href: "#pricing", label: "Pricing" },
  { href: "#team", label: "Team" },
] as const;

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logoLink} aria-label="VitaReBa — home">
        <Logo />
      </Link>
      <div className={styles.navLinks}>
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
      <Link href="/assessment" className={styles.navBtn}>
        Take the Inflection Edge
      </Link>
    </nav>
  );
}
