import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminEmails } from "@/lib/config/company";
import { USER_ROLE, type UserRole, PASSWORD_MIN_LENGTH, BCRYPT_SALT_ROUNDS } from "@/lib/config/auth";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
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
