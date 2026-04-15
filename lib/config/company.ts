export const COMPANY = {
  name: "VitaReBa GmbH",
  shortName: "VitaReBa",
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

/** Parse the ADMIN_EMAILS env var into a clean array — single source to avoid repeated inline parsing */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
}
