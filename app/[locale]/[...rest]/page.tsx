import { notFound } from "next/navigation";

// Catch-all for unmatched paths under /[locale]. Calling notFound() here
// triggers the localized [locale]/not-found.tsx instead of the global root
// not-found.tsx. (next-intl-recommended pattern for localized 404s.)
export default function CatchAllNotFound() {
  notFound();
}
