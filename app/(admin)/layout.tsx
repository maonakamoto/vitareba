import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./admin.module.css";
import { UserDropdown } from "@/components/portal/UserDropdown";
import { AdminNav } from "@/components/admin/AdminNav";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUnreadThreadCount } from "@/lib/domain/messages";
import { USER_ROLE } from "@/lib/config/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== USER_ROLE.admin) redirect("/dashboard");

  const [dbUser, unreadMessages] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    }),
    getAdminUnreadThreadCount(),
  ]);

  const name = dbUser?.name ?? "";
  const email = session.user.email ?? "";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logoLink} aria-label="VitaReBa — home">
          <Logo />
        </Link>
        <p className={styles.adminBadge}>Admin</p>
        <AdminNav unreadMessages={unreadMessages} />
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
