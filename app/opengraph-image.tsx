import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VitaReBa · Metabolic Psychiatry & Systemic Longevity · Zürich";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1a1a22",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Teal accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#2a7a8a",
          }}
        />

        {/* Eyebrow */}
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
          Zürich · Switzerland
        </div>

        {/* Logo */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 300,
            color: "#f8f7f4",
            lineHeight: 1.1,
            marginBottom: 24,
            display: "flex",
          }}
        >
          Vita
          <span style={{ color: "#2a7a8a" }}>Re</span>
          Ba
        </div>

        {/* Tagline */}
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
          Metabolic Psychiatry & Systemic Longevity
        </div>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 40,
          }}
        >
          {["ADHD", "Longevity", "Psychedelic Therapy", "High Performance"].map(
            (pill) => (
              <div
                key={pill}
                style={{
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "8px 16px",
                  background: "rgba(42,122,138,0.12)",
                  color: "#2a7a8a",
                  borderRadius: 20,
                  display: "flex",
                }}
              >
                {pill}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
