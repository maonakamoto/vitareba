import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import Logo from "@/components/Logo";
import styles from "./auth.module.css";
import { COMPANY } from "@/lib/config/company";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({ children, params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logoWrap} aria-label={`${COMPANY.shortName} — home`}>
          <Logo />
        </Link>
        {children}
      </div>
      <p className={styles.pageFooter}>
        {t("tagline")} · {COMPANY.address.city}
      </p>
    </div>
  );
}
