import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./admin.module.css";
import { SignOutButton } from "@/components/portal/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin/patients", label: "Patients" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/documents", label: "Documents" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

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
        <div className={styles.sidebarFooter}>
          <span className={styles.userEmail}>{session.user.email}</span>
          <SignOutButton />
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
