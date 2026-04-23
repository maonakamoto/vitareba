import Link from "next/link";
import styles from "./admin.module.css";
import { ADMIN_ROUTES } from "@/lib/config/routes";

export default function AdminNotFound() {
  return (
    <div className={styles.errorPage}>
      <p className={styles.errorTitle}>Page not found</p>
      <p className={styles.errorBody}>
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>
      <div className={styles.errorActions}>
        <Link href={ADMIN_ROUTES.patients} className={styles.errorRetry} style={{ textDecoration: "none", display: "inline-block" }}>
          Back to patients
        </Link>
      </div>
    </div>
  );
}
