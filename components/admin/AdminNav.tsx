"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "@/app/(admin)/admin.module.css";
import { BADGE_MAX_COUNT } from "@/lib/config/portal";
import { ADMIN_ROUTES } from "@/lib/config/routes";

type NavItem = {
  href: string;
  label: string;
  badgeKey?: "messages";
};

const NAV_ITEMS: NavItem[] = [
  { href: ADMIN_ROUTES.patients,  label: "Patients" },
  { href: ADMIN_ROUTES.bookings,  label: "Bookings" },
  { href: ADMIN_ROUTES.messages,  label: "Messages", badgeKey: "messages" },
  { href: ADMIN_ROUTES.documents, label: "Documents" },
  { href: ADMIN_ROUTES.reports,   label: "Reports" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map(({ href, label, badgeKey }) => {
        const active = isActive(pathname, href);
        const count = badgeKey === "messages" ? unreadMessages : 0;
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem}${active ? ` ${styles.navItemActive}` : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {label}
            {count > 0 && (
              <span className={styles.navBadge} aria-label={`${count} unread`}>
                {count > BADGE_MAX_COUNT ? `${BADGE_MAX_COUNT}+` : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
