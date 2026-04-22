// Auth constants — SSOT for all auth-related magic numbers

/** User role values — mirrors pgEnum("role") in schema */
export const USER_ROLE_VALUES = ["patient", "admin"] as const;
export type UserRole = (typeof USER_ROLE_VALUES)[number];

/** Named constants for user role values — use in comparisons instead of string literals */
export const USER_ROLE = {
  patient: "patient",
  admin: "admin",
} as const satisfies Record<UserRole, UserRole>;

/** bcrypt cost factor used for password hashing — applies to registration, reset, and change-password */
export const BCRYPT_SALT_ROUNDS = 12;

/** Minimum password length — enforced at registration, reset, and change-password */
export const PASSWORD_MIN_LENGTH = 8;

/** How long (ms) a password-reset token remains valid */
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
