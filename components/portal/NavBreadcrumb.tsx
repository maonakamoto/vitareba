"use client";

import { usePathname } from "next/navigation";
import styles from "@/app/(portal)/portal.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";

const ROUTE_LABELS: Record<string, string> = {
  [PORTAL_ROUTES.dashboard]:   "Dashboard",
  [PORTAL_ROUTES.checkin]:     "Daily Check-in",
  [PORTAL_ROUTES.assessment]:  "Assessment",
  [PORTAL_ROUTES.assessments]: "My Results",
  [PORTAL_ROUTES.bookings]:    "Bookings",
  [PORTAL_ROUTES.messages]:    "Messages",
  [PORTAL_ROUTES.profile]:     "Profile",
};

function getLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.startsWith(PORTAL_ROUTES.messages + "/")) return "Conversation";
  return "";
}

export function NavBreadcrumb() {
  const pathname = usePathname();
  const label = getLabel(pathname);
  if (!label) return null;

  return (
    <span className={styles.breadcrumb}>{label}</span>
  );
}
