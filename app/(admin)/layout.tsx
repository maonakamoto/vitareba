import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./admin.module.css";
import { UserDropdown } from "@/components/portal/UserDropdown";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const NAV_ITEMS = [
  { href: "/admin/patients", label: "Patients" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/documents", label: "Documents" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true },
  });

  const name = dbUser?.name ?? "";
  const email = session.user.email ?? "";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logoLink} aria-label="VitaReBa — home">
          <Logo />
        </Link>
        <p className={styles.adminBadge}>Admin</p>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navItem}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className={styles.mainWrap}>
        <header className={styles.header}>
          <div />
          <UserDropdown name={name} email={email} role="admin" />
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
