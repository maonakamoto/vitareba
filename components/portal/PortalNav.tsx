"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "@/app/(portal)/portal.module.css";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IcoDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="5" height="5" rx="1"/>
    <rect x="9.5" y="1.5" width="5" height="5" rx="1"/>
    <rect x="1.5" y="9.5" width="5" height="5" rx="1"/>
    <rect x="9.5" y="9.5" width="5" height="5" rx="1"/>
  </svg>
);

const IcoCheckin = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1.5,9 5,5.5 8,11 11,3.5 14.5,7"/>
  </svg>
);

const IcoAssessment = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 2.5h1a1 1 0 0 1 2 0h1A1.5 1.5 0 0 1 11 4H5A1.5 1.5 0 0 1 5.5 2.5z"/>
    <path d="M4 3.5H3a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5a1 1 0 0 0-1-1h-1"/>
    <line x1="5.5" y1="7" x2="10.5" y2="7"/>
    <line x1="5.5" y1="9.5" x2="8.5" y2="9.5"/>
  </svg>
);

const IcoResults = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1.5" y1="14" x2="14.5" y2="14"/>
    <rect x="3" y="8.5" width="2.5" height="5.5" rx="0.5"/>
    <rect x="6.75" y="5.5" width="2.5" height="8.5" rx="0.5"/>
    <rect x="10.5" y="2.5" width="2.5" height="11.5" rx="0.5"/>
  </svg>
);

const IcoBookings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="3.5" width="13" height="11" rx="1.5"/>
    <line x1="1.5" y1="7.5" x2="14.5" y2="7.5"/>
    <line x1="5" y1="1.5" x2="5" y2="5.5"/>
    <line x1="11" y1="1.5" x2="11" y2="5.5"/>
  </svg>
);

const IcoMessages = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 2h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5.5l-3 2.5V3a1 1 0 0 1 1-1z"/>
  </svg>
);

const IcoProfile = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="5.5" r="3"/>
    <path d="M1.5 14.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6"/>
  </svg>
);

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType;
};

const NAV_GROUPS: NavItem[][] = [
  [
    { href: "/dashboard", label: "Dashboard", Icon: IcoDashboard },
  ],
  [
    { href: "/checkin",     label: "Daily Check-in", Icon: IcoCheckin },
    { href: "/assessment",  label: "Assessment",     Icon: IcoAssessment },
    { href: "/assessments", label: "My Results",     Icon: IcoResults },
  ],
  [
    { href: "/bookings", label: "Bookings", Icon: IcoBookings },
    { href: "/messages", label: "Messages", Icon: IcoMessages },
  ],
  [
    { href: "/profile", label: "Profile", Icon: IcoProfile },
  ],
];

// Items shown in the mobile bottom tab bar (most critical paths)
const BOTTOM_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home",     Icon: IcoDashboard },
  { href: "/checkin",   label: "Check-in", Icon: IcoCheckin },
  { href: "/messages",  label: "Messages", Icon: IcoMessages },
  { href: "/bookings",  label: "Bookings", Icon: IcoBookings },
  { href: "/profile",   label: "Profile",  Icon: IcoProfile },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Sidebar nav (desktop) ────────────────────────────────────────────────────

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Portal navigation">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className={styles.navGroup}>
          {group.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                aria-current={active ? "page" : undefined}
              >
                <span className={styles.navIcon}><Icon /></span>
                <span className={styles.navLabel}>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav} aria-label="Mobile navigation">
      {BOTTOM_ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? `${styles.bottomNavItem} ${styles.bottomNavItemActive}` : styles.bottomNavItem}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.bottomNavIcon}><Icon /></span>
            <span className={styles.bottomNavLabel}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
