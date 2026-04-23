// Route path constants — SSOT for all portal and admin URL paths
// Adding a new portal route: update here + middleware.ts PORTAL_PREFIXES

export const PORTAL_ROUTES = {
  dashboard:   "/dashboard",
  checkin:     "/checkin",
  assessment:  "/assessment",
  assessments: "/assessments",
  goals:       "/goals",
  bookings:    "/bookings",
  messages:    "/messages",
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
