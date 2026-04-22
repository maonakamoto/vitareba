/// <reference types="vitest/globals" />
import { loginSchema, registerSchema, resolveRole } from "./auth";
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
