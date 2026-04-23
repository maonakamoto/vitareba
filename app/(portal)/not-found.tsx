import Link from "next/link";
import styles from "./portal.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export default function PortalNotFound() {
  return (
    <div className={styles.errorPage}>
      <p className={styles.errorTitle}>Page not found</p>
      <p className={styles.errorBody}>
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>
      <div className={styles.errorActions}>
        <Link href={PORTAL_ROUTES.dashboard} className={styles.errorRetry}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
