"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./UserDropdown.module.css";

interface Props {
  name: string;
  email: string;
  role: "admin" | "patient";
}

function initials(name: string, email: string): string {
  if (name.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function UserDropdown({ name, email, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div ref={ref} className={styles.root}>
      <button
        type="button"
        className={styles.avatar}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="User menu"
      >
        {initials(name, email)}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <p className={styles.headerName}>{name || email}</p>
            {name && <p className={styles.headerEmail}>{email}</p>}
          </div>
          <div className={styles.items}>
            {role === "admin" && (
              <Link href="/admin" className={styles.item} onClick={() => setOpen(false)}>
                Admin Panel ↗
              </Link>
            )}
            <Link href="/profile" className={styles.item} onClick={() => setOpen(false)}>
              Profile
            </Link>
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.signOutBtn}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
