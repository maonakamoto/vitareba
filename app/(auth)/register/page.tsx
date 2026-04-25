"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";
import { PASSWORD_MIN_LENGTH } from "@/lib/config/auth";
import { PORTAL_ROUTES, AUTH_ROUTES } from "@/lib/config/routes";
import { sanitizeReturnTo } from "@/lib/domain/auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Sanitize: must be a same-origin relative path. Prevents open-redirect to ?returnTo=https://evil.com.
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"), PORTAL_ROUTES.dashboard);
  const [hasAssessment, setHasAssessment] = useState(false);

  useEffect(() => {
    try {
      setHasAssessment(!!sessionStorage.getItem("pendingAssessment"));
    } catch {}
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
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
        router.push(`${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch {
      setErrors({ email: ["Something went wrong. Please try again."] });
      setLoading(false);
    }
  }

  return (
    <>
      {hasAssessment && (
        <div className={styles.contextBanner}>
          Your Inflection Edge results are ready to save. Create your account and they&apos;ll be waiting in your portal — along with a direct line to Manuel to discuss next steps.
        </div>
      )}
      <h2 className={styles.title}>Create<br />your account</h2>
      <p className={styles.subtitle}>{hasAssessment ? "One step to save your results." : "Email and password — nothing more"}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            autoFocus
          />
          {errors.email && <p className={styles.error}>{errors.email[0]}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`Min. ${PASSWORD_MIN_LENGTH} characters`}
            required
            autoComplete="new-password"
          />
          {errors.password && <p className={styles.error}>{errors.password[0]}</p>}
        </div>
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className={styles.linkRow}>
        <span>
          Already have an account?{" "}
          <Link className={styles.link} href={`${AUTH_ROUTES.login}${returnTo !== PORTAL_ROUTES.dashboard ? `?returnTo=${returnTo}` : ""}`}>
            Sign in
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
