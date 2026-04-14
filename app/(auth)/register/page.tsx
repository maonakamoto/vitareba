"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const [name, setName] = useState("");
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
      body: JSON.stringify({ name, email, password }),
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
      <h1 className={styles.title}>Create account</h1>
      <p className={styles.subtitle}>Start your journey with VitaReBa</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Full name</label>
          <input
            id="name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
          />
          {errors.name && <p className={styles.error}>{errors.name[0]}</p>}
        </div>
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
            placeholder="Min. 8 characters"
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
          <Link className={styles.link} href={`/login${returnTo !== "/dashboard" ? `?returnTo=${returnTo}` : ""}`}>
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
