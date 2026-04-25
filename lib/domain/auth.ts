import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminEmails } from "@/lib/config/company";
import {
  USER_ROLE,
  type UserRole,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  BCRYPT_SALT_ROUNDS,
  LOGIN_LOCKOUT_THRESHOLD,
  LOGIN_LOCKOUT_DURATION_MS,
} from "@/lib/config/auth";

export const loginSchema = z.object({
  email: z.string().email().max(EMAIL_MAX_LENGTH),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(EMAIL_MAX_LENGTH),
  password: z.string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH),
});

export function resolveRole(email: string): UserRole {
  const adminEmails = getAdminEmails().map((e) => e.toLowerCase());
  return adminEmails.includes(email.toLowerCase()) ? USER_ROLE.admin : USER_ROLE.patient;
}

/** Hash a plaintext password using the project's standard bcrypt cost factor */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/** Compare a plaintext password against a stored bcrypt hash */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Brute-force protection ───────────────────────────────────────────────────

/** True when the user is currently locked out from logging in. */
export function isUserLocked(
  user: { lockedUntil: Date | null },
  now: Date = new Date()
): boolean {
  return user.lockedUntil !== null && user.lockedUntil.getTime() > now.getTime();
}

/**
 * Pure state transition for a login attempt outcome.
 * - Success → reset counter and clear any prior lockout.
 * - Failure below threshold → increment counter.
 * - Failure that hits threshold → reset counter to 0 and set lockedUntil = now + duration.
 */
export function nextLoginAttemptState(
  current: { failedLoginAttempts: number },
  success: boolean,
  now: Date = new Date()
): { failedLoginAttempts: number; lockedUntil: Date | null } {
  if (success) return { failedLoginAttempts: 0, lockedUntil: null };
  const next = current.failedLoginAttempts + 1;
  if (next >= LOGIN_LOCKOUT_THRESHOLD) {
    return {
      failedLoginAttempts: 0,
      lockedUntil: new Date(now.getTime() + LOGIN_LOCKOUT_DURATION_MS),
    };
  }
  return { failedLoginAttempts: next, lockedUntil: null };
}
