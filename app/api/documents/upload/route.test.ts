/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdmin,
  mockPut,
  mockInsert,
  mockUserFindFirst,
  mockSendEmail,
  mockRunAfterResponse,
} = vi.hoisted(() => ({
  mockRequireAdmin:     vi.fn(),
  mockPut:             vi.fn(),
  mockInsert:          vi.fn(),
  mockUserFindFirst:   vi.fn(),
  mockSendEmail:       vi.fn(),
  mockRunAfterResponse: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: mockRequireAdmin }));
vi.mock("@vercel/blob",       () => ({ put: mockPut }));
vi.mock("@/lib/email/index",  () => ({ sendEmail: mockSendEmail }));
vi.mock("@/lib/utils/post-response", () => ({ runAfterResponse: mockRunAfterResponse }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users: { findFirst: mockUserFindFirst },
    },
    insert: mockInsert,
  },
}));

import { POST } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ADMIN_SESSION  = { session: { user: { id: "admin-1", role: "admin" } }, error: null };
const UNAUTH         = { session: null, error: new Response(null, { status: 401 }) };
const VALID_PATIENT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const DOC = { id: "doc-1", userId: VALID_PATIENT_ID, title: "Lab results", fileUrl: "https://blob.example.com/file.pdf" };

function makeFile(opts: { name?: string; type?: string; sizeBytes?: number } = {}) {
  const { name = "test.pdf", type = "application/pdf", sizeBytes } = opts;
  const content = sizeBytes ? new Uint8Array(sizeBytes) : new Uint8Array([1, 2, 3]);
  return new File([content], name, { type });
}

function makeFormData(overrides: Record<string, string | File | null> = {}) {
  const form = new FormData();
  const defaults: Record<string, string | File> = {
    file:      makeFile(),
    title:     "Lab results",
    patientId: VALID_PATIENT_ID,
  };
  for (const [key, val] of Object.entries({ ...defaults, ...overrides })) {
    if (val !== null) form.append(key, val as string | File);
  }
  return form;
}

function makeRequest(form: FormData) {
  return new Request("https://example.com/api/documents/upload", { method: "POST", body: form });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/documents/upload", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
    mockPut.mockReset();
    mockInsert.mockReset();
    mockUserFindFirst.mockReset();
    mockSendEmail.mockReset();
    mockRunAfterResponse.mockReset();
    mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
    mockPut.mockResolvedValue({ url: "https://blob.example.com/file.pdf" });
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([DOC]) }),
    });
  });

  it("returns 401 when caller is not an admin", async () => {
    mockRequireAdmin.mockResolvedValue(UNAUTH);
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(401);
  });

  it("returns 400 when file is missing", async () => {
    const form = makeFormData({ file: null });
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is missing", async () => {
    const form = makeFormData({ title: null });
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(400);
  });

  it("returns 400 when patientId is missing", async () => {
    const form = makeFormData({ patientId: null });
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(400);
  });

  it("returns 400 when patientId is not a valid UUID", async () => {
    const form = makeFormData({ patientId: "not-a-uuid" });
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(400);
  });

  it("returns 400 when title exceeds the maximum length", async () => {
    const form = makeFormData({ title: "a".repeat(201) });
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(400);
  });

  it("returns 413 when file exceeds the size limit", async () => {
    const oversized = makeFile({ sizeBytes: 21 * 1024 * 1024 });
    const form = makeFormData({ file: oversized });
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(413);
  });

  it("returns 415 when file MIME type is not in the allowlist", async () => {
    const form = makeFormData({ file: makeFile({ type: "application/x-executable" }) });
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(415);
  });

  it("returns 500 when the blob upload fails", async () => {
    mockPut.mockRejectedValue(new Error("blob service unavailable"));
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(500);
  });

  it("returns 500 when the DB insert fails", async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockRejectedValue(new Error("db down")) }),
    });
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(500);
  });

  it("returns 201 with the document and schedules a patient notification", async () => {
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("doc-1");
    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
  });

  it("emails the patient when the notification callback fires", async () => {
    mockUserFindFirst.mockResolvedValue({ name: "Alice", email: "alice@example.com" });
    await POST(makeRequest(makeFormData()));
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject: expect.stringContaining("Lab results"),
      })
    );
  });

  it("skips email when the patient has no email address", async () => {
    mockUserFindFirst.mockResolvedValue({ name: "Alice", email: null });
    await POST(makeRequest(makeFormData()));
    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
