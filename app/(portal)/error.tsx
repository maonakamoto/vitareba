"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./portal.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal] page error:", error);
  }, [error]);

  return (
    <div className={styles.errorPage}>
      <p className={styles.errorTitle}>Something went wrong</p>
      <p className={styles.errorBody}>
        We hit an unexpected error loading this page. Your data is safe — please try again.
      </p>
      <div className={styles.errorActions}>
        <button type="button" onClick={reset} className={styles.errorRetry}>
          Try again
        </button>
        <Link href={PORTAL_ROUTES.dashboard} className={styles.errorHome}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
