"use client";

import { usePathname } from "next/navigation";
import styles from "@/app/(portal)/portal.module.css";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/checkin":    "Daily Check-in",
  "/assessment": "Assessment",
  "/assessments":"My Results",
  "/bookings":   "Bookings",
  "/messages":   "Messages",
  "/profile":    "Profile",
};

function getLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.startsWith("/messages/")) return "Conversation";
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
