import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./admin.module.css";
import { UserDropdown } from "@/components/portal/UserDropdown";
import { AdminNav } from "@/components/admin/AdminNav";
import { db } from "@/lib/db";
import { users, bookings, profiles } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getAdminUnreadThreadCount } from "@/lib/domain/messages";
import { USER_ROLE } from "@/lib/config/auth";
import { BOOKING_STATUS } from "@/lib/config/booking-status";
import { PATIENT_SIGNAL } from "@/lib/config/admin";
import { COMPANY } from "@/lib/config/company";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== USER_ROLE.admin) redirect(PORTAL_ROUTES.dashboard);

  const [dbUser, unreadMessages, pendingBookings, urgentPatients] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    }),
    getAdminUnreadThreadCount(),
    db.query.bookings.findMany({
      where: eq(bookings.status, BOOKING_STATUS.pending),
      columns: { id: true },
    }).then((rows) => rows.length),
    // Count of patients whose stored signal is critical or attention — fast single-table read
    db.query.profiles.findMany({
      where: inArray(profiles.lastKnownSignal, [PATIENT_SIGNAL.critical, PATIENT_SIGNAL.attention]),
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
        <AdminNav unreadMessages={unreadMessages} pendingBookings={pendingBookings} urgentPatients={urgentPatients} />
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
