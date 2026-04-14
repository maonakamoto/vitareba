import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./portal.module.css";
import { SignOutButton } from "@/components/portal/SignOutButton";

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
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session.user.name ?? session.user.email}</span>
            <span className={styles.userRole}>Patient</span>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
