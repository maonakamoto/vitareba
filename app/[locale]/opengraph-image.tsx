import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { ogImageElement, OG_SIZE } from "@/lib/og/element";

// Per-locale OG image — German visitors sharing /de/ on social media see a
// German tagline, French visitors see French, etc. Generated on demand at the
// edge from the meta.tagline translation key (single source of truth).
export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ locale: string }> };

export default async function OgImage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return new ImageResponse(ogImageElement({ tagline: t("tagline") }), { ...size });
}
