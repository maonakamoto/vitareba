import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/config/company";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COMPANY.shortName} Portal`,
    short_name: COMPANY.shortName,
    description: `Your ${COMPANY.shortName} patient portal — daily check-in, assessments, and consultations.`,
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f7f4",
    theme_color: "#1a1a22",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
