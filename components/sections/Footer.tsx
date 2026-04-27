import { getTranslations } from "next-intl/server";
import { COMPANY } from "@/lib/config/company";
import Logo from "@/components/Logo";
import styles from "./Footer.module.css";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className={styles.footer}>
      <Logo variant="light" tagline={COMPANY.partnerBrand} small />
      <div className={styles.legal}>
        © {COMPANY.foundingYear} {COMPANY.name} · {t("legal")}
      </div>
    </footer>
  );
}
