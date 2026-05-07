/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockVerifyCalendlySignature,
  mockUserFindFirst,
  mockBookingFindFirst,
  mockUpdate,
  mockInsert,
} = vi.hoisted(() => ({
  mockVerifyCalendlySignature: vi.fn(),
  mockUserFindFirst:           vi.fn(),
  mockBookingFindFirst:        vi.fn(),
  mockUpdate:                  vi.fn(),
  mockInsert:                  vi.fn(),
}));

vi.mock("@/lib/webhooks/calendly-signature", () => ({
  verifyCalendlySignature: mockVerifyCalendlySignature,
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users:    { findFirst: mockUserFindFirst },
      bookings: { findFirst: mockBookingFindFirst },
    },
    update: mockUpdate,
    insert: mockInsert,
  },
}));

import { POST } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PATIENT          = { id: "patient-1" };
const PENDING_BOOKING  = { id: "booking-1", preferredDate: "2025-05-01", status: "pending" };
const CONFIRMED_BOOKING = { id: "booking-2", preferredDate: "2025-05-10", status: "confirmed" };

const CREATED_PAYLOAD = {
  event: "invitee.created",
  payload: { email: "alice@example.com", scheduled_event: { start_time: "2025-06-01T10:00:00Z" } },
};

const CANCELED_PAYLOAD = {
  event: "invitee.canceled",
  payload: { email: "alice@example.com" },
};

function makeRequest(body: unknown) {
  return new Request("https://example.com/api/webhooks/calendly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupUpdate() {
  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
  });
}

function setupInsert() {
  mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue({}) });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/calendly", () => {
  beforeEach(() => {
    delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
    mockVerifyCalendlySignature.mockReset();
    mockUserFindFirst.mockReset();
    mockBookingFindFirst.mockReset();
    mockUpdate.mockReset();
    mockInsert.mockReset();
    mockUserFindFirst.mockResolvedValue(PATIENT);
    setupUpdate();
    setupInsert();
  });

  // ─── Signature verification ────────────────────────────────────────────────

  it("returns 401 when signing key is set and signature is invalid", async () => {
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY = "test-key";
    mockVerifyCalendlySignature.mockReturnValue(false);
    const res = await POST(makeRequest(CREATED_PAYLOAD));
    expect(res.status).toBe(401);
    delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  });

  it("skips signature check and proceeds when no signing key is configured", async () => {
    mockBookingFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest(CREATED_PAYLOAD));
    expect(res.status).toBe(200);
  });

  // ─── Parse errors ──────────────────────────────────────────────────────────

  it("returns 400 for malformed JSON body", async () => {
    const res = await POST(
      new Request("https://example.com/api/webhooks/calendly", { method: "POST", body: "{ bad json" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when event field is missing", async () => {
    const res = await POST(makeRequest({ payload: { email: "a@b.com" } }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when payload field is missing", async () => {
    const res = await POST(makeRequest({ event: "invitee.created" }));
    expect(res.status).toBe(400);
  });

  // ─── Email / patient lookup ────────────────────────────────────────────────

  it("returns 200 and skips when invitee has no email", async () => {
    const res = await POST(makeRequest({ event: "invitee.created", payload: {} }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.note).toMatch(/skipped/i);
    expect(mockUserFindFirst).not.toHaveBeenCalled();
  });

  it("returns 200 and skips when patient is not registered in the system", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest(CREATED_PAYLOAD));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.note).toMatch(/skipped/i);
  });

  // ─── invitee.created ──────────────────────────────────────────────────────

  it("upgrades an existing pending booking to confirmed", async () => {
    mockBookingFindFirst.mockResolvedValue(PENDING_BOOKING);
    const res = await POST(makeRequest(CREATED_PAYLOAD));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.action).toBe("confirmed");
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("creates a new confirmed booking when no pending booking exists", async () => {
    mockBookingFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest(CREATED_PAYLOAD));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.action).toBe("confirmed");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 when the invitee.created DB operation fails", async () => {
    mockBookingFindFirst.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest(CREATED_PAYLOAD));
    expect(res.status).toBe(500);
  });

  // ─── invitee.canceled ─────────────────────────────────────────────────────

  it("cancels the most recent confirmed booking", async () => {
    mockBookingFindFirst.mockResolvedValue(CONFIRMED_BOOKING);
    const res = await POST(makeRequest(CANCELED_PAYLOAD));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.action).toBe("cancelled");
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("returns 200 without updating when no confirmed booking exists to cancel", async () => {
    mockBookingFindFirst.mockResolvedValue(null);
    const res = await POST(makeRequest(CANCELED_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 when the invitee.canceled DB operation fails", async () => {
    mockBookingFindFirst.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest(CANCELED_PAYLOAD));
    expect(res.status).toBe(500);
  });

  // ─── Unknown event ─────────────────────────────────────────────────────────

  it("returns 200 with 'not handled' note for unknown event types", async () => {
    const res = await POST(makeRequest({ event: "invitee.no_show", payload: { email: "a@b.com" } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.note).toMatch(/not handled/i);
  });
});
