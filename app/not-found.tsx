import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "0.75rem", textAlign: "center", padding: "2rem", fontFamily: "DM Sans, sans-serif" }}>
      <p style={{ fontSize: "1.25rem", fontWeight: 500, color: "#1a1a22", margin: 0 }}>
        Page not found
      </p>
      <p style={{ color: "#888a96", maxWidth: 400, margin: 0 }}>
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard" style={{ marginTop: "0.5rem", color: "#2a7a8a", fontSize: "0.875rem" }}>
        Go to dashboard
      </Link>
    </div>
  );
}
