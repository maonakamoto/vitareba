export const COMPANY = {
  name: "VitaReBa GmbH",
  shortName: "VitaReBa",
  clinicianName: "Manuel",
  email: "manuel@surfyourlife.org",
  address: {
    street: "Zollikerstrasse 183",
    zip: "8008",
    city: "Zürich",
  },
  foundingYear: 2026,
} as const;

// Single source of truth for the deployed portal URL used in emails and cron routes
export const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://vitareba.ch";

// Default "from" address for transactional emails — used as fallback when RESEND_FROM is unset.
// Sending from vitareba.ch requires domain verification in Resend: https://resend.com/domains
// Until verified, set RESEND_FROM=onboarding@resend.dev in .env.local for testing.
export const DEFAULT_FROM_EMAIL = `${COMPANY.name} <noreply@vitareba.ch>`;

/** Parse the ADMIN_EMAILS env var into a clean array — single source to avoid repeated inline parsing */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
}
