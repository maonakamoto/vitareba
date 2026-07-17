import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Sourcemap upload is optional: only runs when SENTRY_AUTH_TOKEN is set.
  // Build must always pass without any Sentry credentials.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: true,
  telemetry: false,
});
