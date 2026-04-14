"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./Nav.module.css";
import { useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "#pillars", label: "Programmes" },
  { href: "#approach", label: "Approach" },
  { href: "#diagnostics", label: "Diagnostics" },
  { href: "#longevity", label: "Longevity" },
  { href: "#pricing", label: "Pricing" },
  { href: "#team", label: "Team" },
] as const;

export default function Nav() {
  const { data: session } = useSession();

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
      {session ? (
        <Link href="/dashboard" className={styles.navBtn}>
          Dashboard &rarr;
        </Link>
      ) : (
        <>
          <Link href="/login" className={styles.navSignIn}>
            Sign in
          </Link>
          <Link href="/assessment" className={styles.navBtn}>
            Take the Inflection Edge
          </Link>
        </>
      )}
    </nav>
  );
}
