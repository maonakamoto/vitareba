"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import styles from "../auth.module.css";

function RegisterForm() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!data.success) {
      setErrors(data.error ?? {});
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) {
      setErrors({ email: ["Account created — please sign in."] });
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
            autoFocus
          />
          {errors.email && <p className={styles.error}>{errors.email[0]}</p>}
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
            autoComplete="new-password"
          />
          {errors.password && <p className={styles.error}>{errors.password[0]}</p>}
        </div>
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>

      <div className={styles.linkRow}>
        <span>
          {t("hasAccount")}{" "}
          <Link
            className={styles.link}
            href={`/login${returnTo !== "/dashboard" ? `?returnTo=${returnTo}` : ""}`}
          >
            {t("signInLink")}
          </Link>
        </span>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
