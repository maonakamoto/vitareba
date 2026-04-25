/// <reference types="vitest/globals" />
import {
  loginSchema,
  registerSchema,
  resolveRole,
  hashPassword,
  verifyPassword,
  isUserLocked,
  nextLoginAttemptState,
} from "./auth";

// bcrypt cost 12 is intentionally slow (production security); use 4 in tests
vi.mock("@/lib/config/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config/auth")>();
  return { ...actual, BCRYPT_SALT_ROUNDS: 4 };
});
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  LOGIN_LOCKOUT_THRESHOLD,
  LOGIN_LOCKOUT_DURATION_MS,
} from "@/lib/config/auth";

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid email and non-empty password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "abc" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "notanemail", password: "abc" }).success).toBe(false);
  });

  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });

  it("rejects email over EMAIL_MAX_LENGTH", () => {
    const longEmail = "a".repeat(EMAIL_MAX_LENGTH) + "@x.com"; // total > EMAIL_MAX_LENGTH
    expect(loginSchema.safeParse({ email: longEmail, password: "abc" }).success).toBe(false);
  });

  it("rejects password over PASSWORD_MAX_LENGTH", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "a".repeat(PASSWORD_MAX_LENGTH + 1) }).success
    ).toBe(false);
  });

  it("accepts password at exactly PASSWORD_MAX_LENGTH", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "a".repeat(PASSWORD_MAX_LENGTH) }).success
    ).toBe(true);
  });
});

// ─── registerSchema ───────────────────────────────────────────────────────────

describe("registerSchema", () => {
  it("accepts valid email and password at exactly minimum length", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(PASSWORD_MIN_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it("accepts password above minimum length", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(PASSWORD_MIN_LENGTH + 4),
    });
    expect(result.success).toBe(true);
  });

  it("rejects password below minimum length", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(PASSWORD_MIN_LENGTH - 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "bad-email",
      password: "a".repeat(PASSWORD_MIN_LENGTH),
    });
    expect(result.success).toBe(false);
  });

  it("rejects password over PASSWORD_MAX_LENGTH", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(PASSWORD_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects email over EMAIL_MAX_LENGTH", () => {
    const longEmail = "a".repeat(EMAIL_MAX_LENGTH) + "@x.com"; // total > EMAIL_MAX_LENGTH
    const result = registerSchema.safeParse({
      email: longEmail,
      password: "a".repeat(PASSWORD_MIN_LENGTH),
    });
    expect(result.success).toBe(false);
  });
});

// ─── resolveRole ──────────────────────────────────────────────────────────────

describe("resolveRole", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@example.com,boss@clinic.ch";
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  it("returns 'admin' for a known admin email", () => {
    expect(resolveRole("admin@example.com")).toBe("admin");
  });

  it("returns 'admin' for a second admin email", () => {
    expect(resolveRole("boss@clinic.ch")).toBe("admin");
  });

  it("returns 'patient' for an unknown email", () => {
    expect(resolveRole("patient@example.com")).toBe("patient");
  });

  it("is case-insensitive for admin email check", () => {
    expect(resolveRole("ADMIN@EXAMPLE.COM")).toBe("admin");
    expect(resolveRole("Boss@Clinic.ch")).toBe("admin");
  });

  it("returns 'patient' when ADMIN_EMAILS is empty", () => {
    process.env.ADMIN_EMAILS = "";
    expect(resolveRole("anyone@example.com")).toBe("patient");
  });
});

// ─── hashPassword / verifyPassword ────────────────────────────────────────────

describe("hashPassword", () => {
  it("returns a bcrypt hash (starts with $2b$)", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("produces a different hash each call (salted)", async () => {
    const h1 = await hashPassword("secret123");
    const h2 = await hashPassword("secret123");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPassword", () => {
  it("returns true for a matching password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("correct-horse", hash)).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});

// ─── isUserLocked ─────────────────────────────────────────────────────────────

describe("isUserLocked", () => {
  const NOW = new Date("2026-04-25T12:00:00.000Z");

  it("returns false when lockedUntil is null", () => {
    expect(isUserLocked({ lockedUntil: null }, NOW)).toBe(false);
  });

  it("returns true when lockedUntil is in the future", () => {
    const future = new Date(NOW.getTime() + 5 * 60 * 1000);
    expect(isUserLocked({ lockedUntil: future }, NOW)).toBe(true);
  });

  it("returns false when lockedUntil is in the past (lockout expired)", () => {
    const past = new Date(NOW.getTime() - 1000);
    expect(isUserLocked({ lockedUntil: past }, NOW)).toBe(false);
  });

  it("returns false when lockedUntil equals now (boundary: not strictly in the future)", () => {
    expect(isUserLocked({ lockedUntil: NOW }, NOW)).toBe(false);
  });
});

// ─── nextLoginAttemptState ────────────────────────────────────────────────────

describe("nextLoginAttemptState", () => {
  const NOW = new Date("2026-04-25T12:00:00.000Z");

  describe("on success", () => {
    it("resets counter and clears lockout regardless of prior failedLoginAttempts", () => {
      expect(nextLoginAttemptState({ failedLoginAttempts: 0 }, true, NOW)).toEqual({
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      expect(nextLoginAttemptState({ failedLoginAttempts: 3 }, true, NOW)).toEqual({
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    });
  });

  describe("on failure below threshold", () => {
    it("increments counter and leaves lockedUntil null", () => {
      expect(nextLoginAttemptState({ failedLoginAttempts: 0 }, false, NOW)).toEqual({
        failedLoginAttempts: 1,
        lockedUntil: null,
      });
      expect(nextLoginAttemptState({ failedLoginAttempts: 2 }, false, NOW)).toEqual({
        failedLoginAttempts: 3,
        lockedUntil: null,
      });
    });

    it("counter just below threshold increments without locking", () => {
      const result = nextLoginAttemptState(
        { failedLoginAttempts: LOGIN_LOCKOUT_THRESHOLD - 2 },
        false,
        NOW
      );
      expect(result.failedLoginAttempts).toBe(LOGIN_LOCKOUT_THRESHOLD - 1);
      expect(result.lockedUntil).toBeNull();
    });
  });

  describe("on failure that hits the threshold", () => {
    it("resets counter to 0 and sets lockedUntil = now + LOGIN_LOCKOUT_DURATION_MS", () => {
      const result = nextLoginAttemptState(
        { failedLoginAttempts: LOGIN_LOCKOUT_THRESHOLD - 1 },
        false,
        NOW
      );
      expect(result.failedLoginAttempts).toBe(0);
      expect(result.lockedUntil).not.toBeNull();
      expect(result.lockedUntil!.getTime()).toBe(NOW.getTime() + LOGIN_LOCKOUT_DURATION_MS);
    });

    it("triggers lockout on the Nth failure (where N = LOGIN_LOCKOUT_THRESHOLD)", () => {
      let state: { failedLoginAttempts: number; lockedUntil: Date | null } = {
        failedLoginAttempts: 0,
        lockedUntil: null,
      };
      for (let i = 0; i < LOGIN_LOCKOUT_THRESHOLD - 1; i++) {
        state = nextLoginAttemptState(state, false, NOW);
        expect(state.lockedUntil).toBeNull();
      }
      state = nextLoginAttemptState(state, false, NOW);
      expect(state.lockedUntil).not.toBeNull();
    });
  });
});
