import crypto from "crypto";

/**
 * Maximum age (seconds) of a Calendly webhook signature timestamp.
 * Older signatures are rejected as potential replay attacks. Five minutes
 * matches Stripe's default and Calendly's own documented recommendation.
 */
export const CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S = 5 * 60;

/**
 * Verify a Calendly webhook signature. Pure function — extracted from the
 * route handler so it is testable without standing up an HTTP request.
 *
 * The header format is "t=<unix_ts>,v1=<hmac_sha256_hex>". HMAC is computed
 * over `${timestamp}.${rawBody}` keyed with the shared signing secret.
 *
 * Returns false if:
 *   - signingKey is missing or empty (dev environments without the secret)
 *   - header is missing or malformed
 *   - signature does not match the expected HMAC (constant-time compared)
 *   - timestamp is older than CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S, which
 *     prevents replays of captured-then-resubmitted webhooks
 */
export function verifyCalendlySignature({
  rawBody,
  header,
  signingKey,
  nowMs = Date.now(),
}: {
  rawBody: string;
  header: string | null | undefined;
  signingKey: string | undefined;
  nowMs?: number;
}): boolean {
  if (!signingKey) return false;
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  // Replay protection: reject stale timestamps before the (expensive) HMAC.
  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds)) return false;
  const ageSeconds = nowMs / 1000 - tsSeconds;
  if (ageSeconds > CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S) return false;
  // Reject far-future timestamps too (clock skew tolerance, same window)
  if (ageSeconds < -CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S) return false;

  const expected = crypto
    .createHmac("sha256", signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
