// Shared OG-image render — used by both app/opengraph-image.tsx (default English
// fallback) and app/[locale]/opengraph-image.tsx (per-locale tagline).
// Kept in /lib so it stays separate from the route-segment file convention.

import { COLOR_INK, COLOR_OFF, COLOR_TEAL } from "@/lib/config/theme";
import { COMPANY } from "@/lib/config/company";

const PILLS = ["ADHD", "Longevity", "Psychedelic Therapy", "High Performance"];

export function ogImageElement({ tagline }: { tagline: string }) {
  return (
    <div
      style={{
        background: COLOR_INK,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: COLOR_TEAL,
        }}
      />

      <div
        style={{
          fontSize: 16,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(42,122,138,0.8)",
          marginBottom: 24,
          display: "flex",
        }}
      >
        {COMPANY.address.city} · Switzerland
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 300,
          color: COLOR_OFF,
          lineHeight: 1.1,
          marginBottom: 24,
          display: "flex",
        }}
      >
        Vita
        <span style={{ color: COLOR_TEAL }}>Re</span>
        Ba
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 300,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.4,
          maxWidth: 700,
          display: "flex",
        }}
      >
        {tagline}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 40,
        }}
      >
        {PILLS.map((pill) => (
          <div
            key={pill}
            style={{
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "8px 16px",
              background: "rgba(42,122,138,0.12)",
              color: COLOR_TEAL,
              borderRadius: 20,
              display: "flex",
            }}
          >
            {pill}
          </div>
        ))}
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
