import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "VitaReBa · Metabolic Psychiatry & Systemic Longevity · Zürich",
  description:
    "We go beyond diagnosis. We decode the biology behind your mind — and the environment around it — to design a personalised path to sustained high performance, longevity and wellbeing.",
  keywords: [
    "ADHD",
    "Metabolic Psychiatry",
    "Longevity",
    "Zürich",
    "Psychedelic Therapy",
    "Burnout",
    "High Performance",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
