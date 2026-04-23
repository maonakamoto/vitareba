"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import styles from "../auth.module.css";
import { AUTH_ROUTES } from "@/lib/config/routes";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show "sent" — prevents email enumeration even on network error
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <>
        <h1 className={styles.title}>{t("successTitle")}</h1>
        <p className={styles.subtitle}>
          {t("successSub", { email })}
        </p>
        <div className={styles.linkRow}>
          <Link className={styles.link} href={AUTH_ROUTES.login}>{t("backToSignIn")}</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.subtitle}>{t("sub")}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">{t("emailLabel")}</label>
          <input
            id="email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            autoComplete="email"
          />
        </div>
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className={styles.linkRow}>
        <Link className={styles.link} href={AUTH_ROUTES.login}>{t("backToSignIn")}</Link>
      </div>
    </>
  );
}
