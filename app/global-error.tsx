"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] uncaught error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, background: "#f8f7f4" }}>
        <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
          <p style={{ fontSize: "1.25rem", fontWeight: 500, color: "#1a1a22", marginBottom: "0.75rem" }}>
            Something went wrong
          </p>
          <p style={{ color: "#888a96", marginBottom: "1.5rem" }}>
            The application hit an unexpected error. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#2a7a8a", color: "#fff", border: "none", borderRadius: 6, padding: "0.625rem 1.5rem", cursor: "pointer", fontSize: "0.9rem" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
