"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import styles from "../auth.module.css";

function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError(t("error"));
      setLoading(false);
      return;
    }

    router.push(returnTo);
    router.refresh();
  }

  return (
    <>
      <h2 className={styles.title}>
        {t("title")}
        <br />
        <em>{t("titleEm")}</em>
      </h2>
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
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">{t("passwordLabel")}</label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className={styles.linkRow}>
        <span>
          {t("noAccount")}{" "}
          <Link
            className={styles.link}
            href={`/register${returnTo !== "/dashboard" ? `?returnTo=${returnTo}` : ""}`}
          >
            {t("registerLink")}
          </Link>
        </span>
        <Link className={styles.link} href="/forgot-password">
          {t("forgotPassword")}
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
