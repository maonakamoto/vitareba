// Route path constants — SSOT for all portal, admin, and auth URL paths
// Adding a new portal route: update here + middleware.ts PORTAL_PREFIXES

export const AUTH_ROUTES = {
  login:          "/login",
  register:       "/register",
  forgotPassword: "/forgot-password",
  resetPassword:  "/reset-password",
} as const satisfies Record<string, string>;

export const PORTAL_ROUTES = {
  dashboard:   "/dashboard",
  checkin:     "/checkin",
  assessment:  "/assessment",
  assessments: "/assessments",
  goals:       "/goals",
  bookings:    "/bookings",
  messages:    "/messages",
  documents:   "/documents",
  profile:     "/profile",
} as const satisfies Record<string, string>;

export const ADMIN_ROUTES = {
  root:      "/admin",
  patients:  "/admin/patients",
  bookings:  "/admin/bookings",
  messages:  "/admin/messages",
  documents: "/admin/documents",
  reports:   "/admin/reports",
} as const satisfies Record<string, string>;

/**
 * Request header set by proxy.ts middleware containing the URL-derived locale.
 * Read by app/layout.tsx so <html lang> reflects the actual URL — not a cookie
 * (which crawlers don't carry, breaking SEO for non-default locales).
 */
export const LOCALE_HEADER = "x-vita-locale";
