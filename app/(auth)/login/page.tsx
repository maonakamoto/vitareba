"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";
import { PORTAL_ROUTES, AUTH_ROUTES } from "@/lib/config/routes";
import { sanitizeReturnTo } from "@/lib/domain/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Sanitize: must be a same-origin relative path. Prevents open-redirect to ?returnTo=https://evil.com.
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"), PORTAL_ROUTES.dashboard);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className={styles.title}>Welcome<br />back</h2>
      <p className={styles.subtitle}>Sign in to continue</p>

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
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className={styles.linkRow}>
        <span>
          No account?{" "}
          <Link className={styles.link} href={`${AUTH_ROUTES.register}${returnTo !== PORTAL_ROUTES.dashboard ? `?returnTo=${returnTo}` : ""}`}>
            Register
          </Link>
        </span>
        <Link className={styles.link} href={AUTH_ROUTES.forgotPassword}>Forgot password?</Link>
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
