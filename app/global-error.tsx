"use client";

import { useEffect } from "react";
import styles from "./global-error.module.css";

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
      <body className={styles.body}>
        <div className={styles.container}>
          <p className={styles.title}>Something went wrong</p>
          <p className={styles.message}>
            The application hit an unexpected error. Please try again.
          </p>
          <button type="button" onClick={reset} className={styles.button}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
