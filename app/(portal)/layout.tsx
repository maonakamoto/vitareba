import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./portal.module.css";
import { UserDropdown } from "@/components/portal/UserDropdown";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assessment", label: "Take Assessment" },
  { href: "/assessments", label: "My Results" },
  { href: "/bookings", label: "Bookings" },
  { href: "/messages", label: "Messages" },
  { href: "/profile", label: "Profile" },
] as const;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

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
          <UserDropdown name={name} email={email} role={session.user.role as "admin" | "patient"} />
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
