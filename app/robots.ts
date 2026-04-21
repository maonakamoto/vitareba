import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitareba.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep portal and admin out of search indices
        disallow: [
          "/dashboard",
          "/assessment",
          "/assessments",
          "/checkin",
          "/bookings",
          "/messages",
          "/profile",
          "/admin",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
