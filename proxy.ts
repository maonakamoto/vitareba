import { auth } from "@/lib/auth/edge";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/lib/config/auth";
import { PORTAL_ROUTES, ADMIN_ROUTES, AUTH_ROUTES } from "@/lib/config/routes";

const intlMiddleware = createIntlMiddleware(routing);

// Portal / admin paths: auth-guard only, bypass locale routing.
// Derived from PORTAL_ROUTES so adding a new portal route only requires
// updating lib/config/routes.ts — not this file too.
const PORTAL_PREFIXES = [
  ...Object.values(PORTAL_ROUTES),
  "/admin", // all admin sub-routes share this prefix
  "/api",
];

// Auth paths as they appear under a locale prefix (e.g. /de/login)
// Derived from AUTH_ROUTES so adding a new auth page only requires updating lib/config/routes.ts
const LOCALE_AUTH_SUFFIXES = Object.values(AUTH_ROUTES);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const dest = session?.user.role === USER_ROLE.admin ? ADMIN_ROUTES.patients : PORTAL_ROUTES.dashboard;

  // ── Portal / admin ─────────────────────────────────────────────────────
  if (PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!session) {
      const loginUrl = new URL(AUTH_ROUTES.login, req.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith(ADMIN_ROUTES.root) && session.user.role !== USER_ROLE.admin) {
      return NextResponse.redirect(new URL(PORTAL_ROUTES.dashboard, req.url));
    }
    return NextResponse.next();
  }

  // ── Locale-prefixed portal paths: redirect to canonical ───────────────
  // e.g. /en/dashboard → /dashboard, /de/profile → /profile
  const localePortalMatch = routing.locales.flatMap((locale) =>
    PORTAL_PREFIXES.map((p) => ({ locale, prefix: p })),
  ).find(({ locale, prefix }) =>
    pathname === `/${locale}${prefix}` || pathname.startsWith(`/${locale}${prefix}/`),
  );
  if (localePortalMatch) {
    const stripped = pathname.slice(localePortalMatch.locale.length + 1); // remove /locale
    return NextResponse.redirect(new URL(stripped, req.url));
  }

  // ── Marketing / auth: locale routing ───────────────────────────────────

  // Redirect logged-in users away from locale-prefixed auth pages
  const isLocaleAuthPath = LOCALE_AUTH_SUFFIXES.some((suffix) =>
    routing.locales.some(
      (locale) =>
        pathname === `/${locale}${suffix}` ||
        pathname.startsWith(`/${locale}${suffix}/`),
    ),
  );
  if (session && isLocaleAuthPath) {
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon|opengraph-image|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
