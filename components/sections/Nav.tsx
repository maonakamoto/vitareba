"use client";

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

interface NavProps {
  onAssessmentOpen: () => void;
}

export default function Nav({ onAssessmentOpen }: NavProps) {
  return (
    <nav className={styles.nav}>
      <Logo />
      <div className={styles.navLinks}>
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
      <button className={styles.navBtn} onClick={onAssessmentOpen}>
        Take the Inflection Edge
      </button>
    </nav>
  );
}
