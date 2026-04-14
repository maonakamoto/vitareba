"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Password reset email flow — wire up with Resend when ready
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          If an account exists for <strong>{email}</strong>, you will receive a
          password reset link shortly.
        </p>
        <div className={styles.linkRow}>
          <Link className={styles.link} href="/login">← Back to sign in</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Reset password</h1>
      <p className={styles.subtitle}>
        Enter your email and we&apos;ll send you a reset link.
      </p>

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
        <button type="submit" className={styles.submit}>Send reset link</button>
      </form>

      <div className={styles.linkRow}>
        <Link className={styles.link} href="/login">← Back to sign in</Link>
      </div>
    </>
  );
}
