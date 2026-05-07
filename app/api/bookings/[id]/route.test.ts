/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdmin,
  mockRequireSession,
  mockBookingFindFirst,
  mockUserFindFirst,
  mockUpdate,
  mockSendEmail,
  mockGetAdminEmails,
  mockRunAfterResponse,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockRequireSession: vi.fn(),
  mockBookingFindFirst: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockUpdate: vi.fn(),
  mockSendEmail: vi.fn(),
  mockGetAdminEmails: vi.fn(),
  // Capture only — tests invoke the callback explicitly via mock.calls to
  // avoid floating-Promise races (the route calls runAfterResponse without await).
  mockRunAfterResponse: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAdmin: mockRequireAdmin,
  requireSession: mockRequireSession,
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      bookings: { findFirst: mockBookingFindFirst },
      users:    { findFirst: mockUserFindFirst },
    },
    update: mockUpdate,
  },
}));

vi.mock("@/lib/email/index", () => ({ sendEmail: mockSendEmail }));

vi.mock("@/lib/config/company", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config/company")>();
  return { ...actual, getAdminEmails: mockGetAdminEmails, PORTAL_URL: "https://portal.example.com" };
});

vi.mock("@/lib/utils/post-response", () => ({ runAfterResponse: mockRunAfterResponse }));

import { PATCH, DELETE } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ADMIN_SESSION   = { session: { user: { id: "admin-1",   role: "admin",   email: "admin@example.com"  } }, error: null };
const PATIENT_SESSION = { session: { user: { id: "patient-1", role: "patient", email: "alice@example.com"  } }, error: null };
const UNAUTH          = { session: null, error: new Response(null, { status: 401 }) };

const BOOKING = {
  id: "booking-1", userId: "patient-1", status: "pending",
  bookingType: "consultation", machineType: null,
  preferredDate: null, notes: null, createdAt: new Date("2026-05-07T00:00:00.000Z"),
};

const PARAMS = { params: Promise.resolve({ id: "booking-1" }) };

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Used by PATCH — chain ends with .returning()
function setupUpdateReturning(returning: object[]) {
  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(returning),
      }),
    }),
  });
}

// Used by DELETE — chain ends with .where() (no .returning())
function setupUpdateNoReturning() {
  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  });
}

function patchReq(status: string) {
  return new Request("https://example.com/api/bookings/booking-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PATCH /api/bookings/[id]", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
    mockUserFindFirst.mockReset();
    mockSendEmail.mockReset();
    mockGetAdminEmails.mockReset();
    mockRunAfterResponse.mockReset();
    mockSendEmail.mockResolvedValue(undefined);
    mockGetAdminEmails.mockReturnValue(["admin@example.com"]);
    setupUpdateReturning([{ ...BOOKING, status: "confirmed" }]);
  });

  it("returns 401 when caller is not admin", async () => {
    mockRequireAdmin.mockResolvedValue(UNAUTH);
    const res = await PATCH(patchReq("confirmed"), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid status value", async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
    const res = await PATCH(patchReq("invalid_status"), PARAMS);
    expect(res.status).toBe(400);
  });

  it("returns 500 when the DB update throws", async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error("db down")),
        }),
      }),
    });
    const res = await PATCH(patchReq("confirmed"), PARAMS);
    expect(res.status).toBe(500);
  });

  it("returns 404 when the booking does not exist", async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
    setupUpdateReturning([]); // empty returning[] = WHERE matched nothing
    const res = await PATCH(patchReq("confirmed"), PARAMS);
    expect(res.status).toBe(404);
  });

  it("sends patient email when status transitions to confirmed", async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
    setupUpdateReturning([{ ...BOOKING, status: "confirmed" }]);
    mockUserFindFirst.mockResolvedValue({ name: "Alice", email: "alice@example.com" });

    const res = await PATCH(patchReq("confirmed"), PARAMS);
    expect(res.status).toBe(200);
    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject: expect.stringContaining("confirmed"),
      })
    );
  });

  it("sends patient email when status transitions to cancelled", async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
    setupUpdateReturning([{ ...BOOKING, status: "cancelled" }]);
    mockUserFindFirst.mockResolvedValue({ name: "Alice", email: "alice@example.com" });

    const res = await PATCH(patchReq("cancelled"), PARAMS);
    expect(res.status).toBe(200);
    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject: expect.stringContaining("cancelled"),
      })
    );
  });

  it("does not schedule email when status transitions to attended", async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
    setupUpdateReturning([{ ...BOOKING, status: "attended" }]);

    const res = await PATCH(patchReq("attended"), PARAMS);
    expect(res.status).toBe(200);
    expect(mockRunAfterResponse).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/bookings/[id]", () => {
  beforeEach(() => {
    mockRequireSession.mockReset();
    mockBookingFindFirst.mockReset();
    mockUserFindFirst.mockReset();
    mockUpdate.mockReset();
    mockSendEmail.mockReset();
    mockGetAdminEmails.mockReset();
    mockRunAfterResponse.mockReset();
    mockSendEmail.mockResolvedValue(undefined);
    mockGetAdminEmails.mockReturnValue(["admin@example.com"]);
    setupUpdateNoReturning();
    mockBookingFindFirst.mockResolvedValue(BOOKING);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireSession.mockResolvedValue(UNAUTH);
    const res = await DELETE(new Request("https://example.com/api/bookings/booking-1"), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the booking does not exist", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockBookingFindFirst.mockResolvedValue(null);
    const res = await DELETE(new Request("https://example.com/api/bookings/booking-1"), PARAMS);
    expect(res.status).toBe(404);
  });

  it("returns 403 when patient tries to cancel another patient's booking", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockBookingFindFirst.mockResolvedValue({ ...BOOKING, userId: "other-patient" });
    const res = await DELETE(new Request("https://example.com/api/bookings/booking-1"), PARAMS);
    expect(res.status).toBe(403);
  });

  it("returns 400 when booking status is not pending", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockBookingFindFirst.mockResolvedValue({ ...BOOKING, status: "confirmed" });
    const res = await DELETE(new Request("https://example.com/api/bookings/booking-1"), PARAMS);
    expect(res.status).toBe(400);
  });

  it("returns 500 when the DB update throws", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("db down")),
      }),
    });
    const res = await DELETE(new Request("https://example.com/api/bookings/booking-1"), PARAMS);
    expect(res.status).toBe(500);
  });

  it("cancels booking and schedules admin notification email", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockUserFindFirst.mockResolvedValue({ name: "Alice", email: "alice@example.com" });

    const res = await DELETE(new Request("https://example.com/api/bookings/booking-1"), PARAMS);
    expect(res.status).toBe(200);
    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["admin@example.com"],
        subject: expect.stringContaining("cancelled"),
      })
    );
  });

  it("cancels booking without scheduling notification when no admin emails configured", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockGetAdminEmails.mockReturnValue([]);

    const res = await DELETE(new Request("https://example.com/api/bookings/booking-1"), PARAMS);
    expect(res.status).toBe(200);
    expect(mockRunAfterResponse).not.toHaveBeenCalled();
  });
});
