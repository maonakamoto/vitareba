"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "@/app/(admin)/admin.module.css";

type NavItem = {
  href: string;
  label: string;
  badgeKey?: "messages";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/patients",  label: "Patients" },
  { href: "/admin/bookings",  label: "Bookings" },
  { href: "/admin/messages",  label: "Messages", badgeKey: "messages" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/reports",   label: "Reports" },
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
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
