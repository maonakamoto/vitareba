import Link from "next/link";
import { COLOR_INK, COLOR_MUTED, COLOR_TEAL } from "@/lib/config/theme";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "0.75rem", textAlign: "center", padding: "2rem", fontFamily: "DM Sans, sans-serif" }}>
      <p style={{ fontSize: "1.25rem", fontWeight: 500, color: COLOR_INK, margin: 0 }}>
        Page not found
      </p>
      <p style={{ color: COLOR_MUTED, maxWidth: 400, margin: 0 }}>
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href={PORTAL_ROUTES.dashboard} style={{ marginTop: "0.5rem", color: COLOR_TEAL, fontSize: "0.875rem" }}>
        Go to dashboard
      </Link>
    </div>
  );
}
