/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireSession,
  mockThreadFindFirst,
  mockUserFindFirst,
  mockInsert,
  mockUpdate,
  mockSendEmail,
  mockGetAdminEmails,
  mockRunAfterResponse,
} = vi.hoisted(() => ({
  mockRequireSession: vi.fn(),
  mockThreadFindFirst: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockSendEmail: vi.fn(),
  mockGetAdminEmails: vi.fn(),
  // Capture only — tests invoke the callback explicitly via mock.calls to
  // avoid floating-Promise races (the route calls runAfterResponse without await).
  mockRunAfterResponse: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireSession: mockRequireSession }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      threads:  { findFirst: mockThreadFindFirst },
      users:    { findFirst: mockUserFindFirst },
    },
    insert: mockInsert,
    update: mockUpdate,
  },
}));

vi.mock("@/lib/email/index", () => ({ sendEmail: mockSendEmail }));

vi.mock("@/lib/config/company", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config/company")>();
  return { ...actual, getAdminEmails: mockGetAdminEmails, PORTAL_URL: "https://portal.example.com" };
});

vi.mock("@/lib/utils/post-response", () => ({ runAfterResponse: mockRunAfterResponse }));

import { GET, POST } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PATIENT_SESSION = { session: { user: { id: "patient-1", role: "patient", email: "alice@example.com" } }, error: null };
const ADMIN_SESSION   = { session: { user: { id: "admin-1",   role: "admin",   email: "admin@example.com" } }, error: null };
const UNAUTH          = { session: null, error: new Response(null, { status: 401 }) };

const THREAD = {
  id: "thread-1",
  patientId: "patient-1",
  subject: "Focus concerns",
  lastMessageAt: new Date("2026-05-07T00:00:00.000Z"),
  messages: [],
  patient: { id: "patient-1", name: "Alice", email: "alice@example.com" },
};

const MESSAGE = {
  id: "msg-1", threadId: "thread-1", senderId: "patient-1",
  body: "Hello", createdAt: new Date("2026-05-07T00:00:00.000Z"), readAt: null,
};

const VALID_THREAD_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const PARAMS = { params: Promise.resolve({ threadId: VALID_THREAD_ID }) };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/messages/[threadId]", () => {
  beforeEach(() => {
    mockRequireSession.mockReset();
    mockThreadFindFirst.mockReset();
    mockUpdate.mockReset();
    mockRunAfterResponse.mockReset();
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireSession.mockResolvedValue(UNAUTH);
    const res = await GET(new Request("https://example.com/api/messages/thread-1"), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 500 when the DB query throws", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockThreadFindFirst.mockRejectedValue(new Error("db down"));
    const res = await GET(new Request("https://example.com/api/messages/thread-1"), PARAMS);
    expect(res.status).toBe(500);
  });

  it("returns 404 when the thread does not exist", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockThreadFindFirst.mockResolvedValue(null);
    const res = await GET(new Request("https://example.com/api/messages/thread-1"), PARAMS);
    expect(res.status).toBe(404);
  });

  it("returns 403 when patient accesses another patient's thread", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockThreadFindFirst.mockResolvedValue({ ...THREAD, patientId: "other-patient" });
    const res = await GET(new Request("https://example.com/api/messages/thread-1"), PARAMS);
    expect(res.status).toBe(403);
  });

  it("returns thread data and schedules mark-read after response", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockThreadFindFirst.mockResolvedValue(THREAD);

    const res = await GET(new Request("https://example.com/api/messages/thread-1"), PARAMS);
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.id).toBe("thread-1");
    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    // Run the captured callback to confirm it marks messages as read
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("POST /api/messages/[threadId]", () => {
  beforeEach(() => {
    mockRequireSession.mockReset();
    mockThreadFindFirst.mockReset();
    mockUserFindFirst.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockSendEmail.mockReset();
    mockGetAdminEmails.mockReset();
    mockRunAfterResponse.mockReset();
    mockSendEmail.mockResolvedValue(undefined);
    mockGetAdminEmails.mockReturnValue(["admin@example.com"]);
    mockThreadFindFirst.mockResolvedValue(THREAD);
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([MESSAGE]),
      }),
    });
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireSession.mockResolvedValue(UNAUTH);
    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello" }),
    }), PARAMS);
    expect(res.status).toBe(401);
  });

  it("returns 500 when thread lookup throws", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockThreadFindFirst.mockRejectedValue(new Error("db down"));
    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello" }),
    }), PARAMS);
    expect(res.status).toBe(500);
  });

  it("returns 404 when thread does not exist", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockThreadFindFirst.mockResolvedValue(null);
    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello" }),
    }), PARAMS);
    expect(res.status).toBe(404);
  });

  it("returns 403 when patient sends to another patient's thread", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockThreadFindFirst.mockResolvedValue({ ...THREAD, patientId: "other-patient" });
    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello" }),
    }), PARAMS);
    expect(res.status).toBe(403);
  });

  it("returns 400 for an empty message body", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "" }), // min(1) fails
    }), PARAMS);
    expect(res.status).toBe(400);
  });

  it("returns 500 when the DB insert throws", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("db down")),
      }),
    });
    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello" }),
    }), PARAMS);
    expect(res.status).toBe(500);
  });

  it("sends admin notification when patient posts a message", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockUserFindFirst.mockResolvedValue({ name: "Alice", email: "alice@example.com" });

    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello" }),
    }), PARAMS);
    expect(res.status).toBe(201);
    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["admin@example.com"],
        subject: expect.stringContaining("Focus concerns"),
      })
    );
  });

  it("sends patient notification when admin posts a message", async () => {
    mockRequireSession.mockResolvedValue(ADMIN_SESSION);
    // Admin callback: Promise.all([patient lookup, sender lookup])
    mockUserFindFirst
      .mockResolvedValueOnce({ name: "Alice", email: "alice@example.com" }) // patient
      .mockResolvedValueOnce({ name: "Manuel" });                           // admin sender

    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hi Alice" }),
    }), PARAMS);
    expect(res.status).toBe(201);
    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject: expect.stringContaining("Focus concerns"),
      })
    );
  });

  it("does not schedule notification when patient sends and no admin emails configured", async () => {
    mockRequireSession.mockResolvedValue(PATIENT_SESSION);
    mockGetAdminEmails.mockReturnValue([]);

    const res = await POST(new Request("https://example.com/api/messages/thread-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hello" }),
    }), PARAMS);
    expect(res.status).toBe(201);
    expect(mockRunAfterResponse).not.toHaveBeenCalled();
  });
});
