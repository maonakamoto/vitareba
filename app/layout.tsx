import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { COMPANY, SITE_URL } from "@/lib/config/company";
import { SessionProvider } from "@/components/portal/SessionProvider";
import { cookies } from "next/headers";
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

const TITLE = `${COMPANY.shortName} · Metabolic Psychiatry & Systemic Longevity · Zürich`;
const DESCRIPTION =
  "We go beyond diagnosis. We decode the biology behind your mind — and the environment around it — to design a personalised path to sustained high performance, longevity and wellbeing.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ADHD",
    "Metabolic Psychiatry",
    "Longevity",
    "Zürich",
    "Psychedelic Therapy",
    "Burnout",
    "High Performance",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: COMPANY.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "de";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: COMPANY.name,
    description: DESCRIPTION,
    url: SITE_URL,
    email: COMPANY.email,
    foundingDate: String(COMPANY.foundingYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      postalCode: COMPANY.address.zip,
      addressLocality: COMPANY.address.city,
      addressCountry: "CH",
    },
    medicalSpecialty: [
      "Psychiatry",
      "Metabolic Medicine",
      "Longevity Medicine",
    ],
  };

  return (
    <html lang={locale} className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
