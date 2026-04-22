/// <reference types="vitest/globals" />
import { loginSchema, registerSchema, resolveRole, hashPassword, verifyPassword } from "./auth";

// bcrypt cost 12 is intentionally slow (production security); use 4 in tests
vi.mock("@/lib/config/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config/auth")>();
  return { ...actual, BCRYPT_SALT_ROUNDS: 4 };
});
import { PASSWORD_MIN_LENGTH } from "@/lib/config/auth";

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
