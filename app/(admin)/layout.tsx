import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./admin.module.css";
import { UserDropdown } from "@/components/portal/UserDropdown";
import { AdminNav } from "@/components/admin/AdminNav";
import { db } from "@/lib/db";
import { users, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUnreadThreadCount } from "@/lib/domain/messages";
import { USER_ROLE } from "@/lib/config/auth";
import { BOOKING_STATUS } from "@/lib/config/booking-status";
import { COMPANY } from "@/lib/config/company";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== USER_ROLE.admin) redirect(PORTAL_ROUTES.dashboard);

  const [dbUser, unreadMessages, pendingBookings] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    }),
    getAdminUnreadThreadCount(),
    db.query.bookings.findMany({
      where: eq(bookings.status, BOOKING_STATUS.pending),
      columns: { id: true },
    }).then((rows) => rows.length),
  ]);

  const name = dbUser?.name ?? "";
  const email = session.user.email ?? "";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logoLink} aria-label={`${COMPANY.shortName} — home`}>
          <Logo />
        </Link>
        <p className={styles.adminBadge}>Admin</p>
        <AdminNav unreadMessages={unreadMessages} pendingBookings={pendingBookings} />
      </aside>
      <div className={styles.mainWrap}>
        <header className={styles.header}>
          <div />
          <UserDropdown name={name} email={email} role={USER_ROLE.admin} />
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
