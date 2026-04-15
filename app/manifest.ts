import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VitaReBa Portal",
    short_name: "VitaReBa",
    description: "Your VitaReBa patient portal — daily check-in, assessments, and consultations.",
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
