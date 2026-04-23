import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/config/company";
import { COLOR_OFF, COLOR_INK } from "@/lib/config/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COMPANY.shortName} Portal`,
    short_name: COMPANY.shortName,
    description: `Your ${COMPANY.shortName} patient portal — daily check-in, assessments, and consultations.`,
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: COLOR_OFF,
    theme_color: COLOR_INK,
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
