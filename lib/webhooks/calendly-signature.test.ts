/// <reference types="vitest/globals" />
import crypto from "crypto";
import {
  verifyCalendlySignature,
  CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S,
} from "./calendly-signature";

const SIGNING_KEY = "test-secret-key-do-not-use-in-prod";
const RAW_BODY = JSON.stringify({ event: "invitee.created", payload: { foo: "bar" } });
// Anchor "now" so age calculations are deterministic
const NOW_MS = new Date("2026-04-25T12:00:00.000Z").getTime();

function signedHeader(timestampS: number, body: string = RAW_BODY, key: string = SIGNING_KEY): string {
  const v1 = crypto.createHmac("sha256", key).update(`${timestampS}.${body}`).digest("hex");
  return `t=${timestampS},v1=${v1}`;
}

describe("verifyCalendlySignature", () => {
  describe("rejects (returns false)", () => {
    it("missing signingKey", () => {
      const header = signedHeader(NOW_MS / 1000);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: undefined, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("empty signingKey", () => {
      const header = signedHeader(NOW_MS / 1000);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: "", nowMs: NOW_MS })
      ).toBe(false);
    });

    it("missing header (null)", () => {
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header: null, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("missing header (undefined)", () => {
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header: undefined, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("malformed header (no t= part)", () => {
      const header = `v1=${crypto.createHmac("sha256", SIGNING_KEY).update(`x.${RAW_BODY}`).digest("hex")}`;
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("malformed header (no v1= part)", () => {
      const header = `t=${Math.floor(NOW_MS / 1000)}`;
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("non-numeric timestamp", () => {
      const v1 = crypto.createHmac("sha256", SIGNING_KEY).update(`abc.${RAW_BODY}`).digest("hex");
      const header = `t=abc,v1=${v1}`;
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("wrong signature (different body signed)", () => {
      const header = signedHeader(NOW_MS / 1000, "different-body");
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("wrong signature (different key)", () => {
      const header = signedHeader(NOW_MS / 1000, RAW_BODY, "different-key");
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("malformed v1 hex (odd length)", () => {
      const header = `t=${Math.floor(NOW_MS / 1000)},v1=abc`;
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    // ─── Replay protection (the actual security fix) ─────────────────────────

    it("timestamp older than tolerance window (replay attack)", () => {
      const stale = NOW_MS / 1000 - CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S - 1;
      const header = signedHeader(stale);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("timestamp from one hour ago (replay attack)", () => {
      const stale = NOW_MS / 1000 - 60 * 60;
      const header = signedHeader(stale);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });

    it("timestamp from far in the future (clock skew abuse)", () => {
      const future = NOW_MS / 1000 + CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S + 1;
      const header = signedHeader(future);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(false);
    });
  });

  describe("accepts (returns true)", () => {
    it("fresh signature signed at the same instant", () => {
      const header = signedHeader(NOW_MS / 1000);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(true);
    });

    it("signature signed within tolerance (4 minutes ago)", () => {
      const header = signedHeader(NOW_MS / 1000 - 4 * 60);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(true);
    });

    it("signature with small clock skew into the future (1 minute)", () => {
      const header = signedHeader(NOW_MS / 1000 + 60);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(true);
    });

    it("signature at the exact tolerance boundary", () => {
      const header = signedHeader(NOW_MS / 1000 - CALENDLY_WEBHOOK_TIMESTAMP_TOLERANCE_S);
      expect(
        verifyCalendlySignature({ rawBody: RAW_BODY, header, signingKey: SIGNING_KEY, nowMs: NOW_MS })
      ).toBe(true);
    });
  });
});
