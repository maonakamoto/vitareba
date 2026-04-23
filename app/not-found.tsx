import Link from "next/link";
import styles from "./not-found.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <p className={styles.title}>Page not found</p>
      <p className={styles.body}>
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href={PORTAL_ROUTES.dashboard} className={styles.link}>
        Go to dashboard
      </Link>
    </div>
  );
}
