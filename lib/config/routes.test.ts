import { describe, it, expect } from "vitest";
import { AUTH_ROUTES, PORTAL_ROUTES, ADMIN_ROUTES } from "./routes";

describe("AUTH_ROUTES", () => {
  it("all values start with /", () => {
    for (const route of Object.values(AUTH_ROUTES)) {
      expect(route).toMatch(/^\//);
    }
  });

  it("has login, register, forgotPassword, resetPassword", () => {
    expect(AUTH_ROUTES.login).toBe("/login");
    expect(AUTH_ROUTES.register).toBe("/register");
    expect(AUTH_ROUTES.forgotPassword).toBe("/forgot-password");
    expect(AUTH_ROUTES.resetPassword).toBe("/reset-password");
  });

  it("no duplicate values", () => {
    const values = Object.values(AUTH_ROUTES);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("PORTAL_ROUTES", () => {
  it("all values start with /", () => {
    for (const route of Object.values(PORTAL_ROUTES)) {
      expect(route).toMatch(/^\//);
    }
  });

  it("no portal route overlaps with auth routes", () => {
    const authValues = new Set(Object.values(AUTH_ROUTES));
    for (const route of Object.values(PORTAL_ROUTES)) {
      expect(authValues.has(route)).toBe(false);
    }
  });

  it("has dashboard and core patient routes", () => {
    expect(PORTAL_ROUTES.dashboard).toBe("/dashboard");
    expect(PORTAL_ROUTES.messages).toBe("/messages");
    expect(PORTAL_ROUTES.assessment).toBe("/assessment");
    expect(PORTAL_ROUTES.bookings).toBe("/bookings");
  });

  it("no duplicate values", () => {
    const values = Object.values(PORTAL_ROUTES);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("ADMIN_ROUTES", () => {
  it("all values start with /admin", () => {
    for (const route of Object.values(ADMIN_ROUTES)) {
      expect(route).toMatch(/^\/admin/);
    }
  });

  it("root is exactly /admin", () => {
    expect(ADMIN_ROUTES.root).toBe("/admin");
  });

  it("no duplicate values", () => {
    const values = Object.values(ADMIN_ROUTES);
    expect(new Set(values).size).toBe(values.length);
  });
});
