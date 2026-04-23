"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] page error:", error);
  }, [error]);

  return (
    <div className={styles.errorPage}>
      <p className={styles.errorTitle}>Something went wrong</p>
      <p className={styles.errorBody}>
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <div className={styles.errorActions}>
        <button type="button" onClick={reset} className={styles.errorRetry}>
          Try again
        </button>
        <Link href="/admin/patients" className={styles.errorHome}>
          Back to patients
        </Link>
      </div>
    </div>
  );
}
