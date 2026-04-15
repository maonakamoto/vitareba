// Auth constants — SSOT for all auth-related magic numbers

/** bcrypt cost factor used for password hashing — applies to registration, reset, and change-password */
export const BCRYPT_SALT_ROUNDS = 12;

/** How long (ms) a password-reset token remains valid */
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
