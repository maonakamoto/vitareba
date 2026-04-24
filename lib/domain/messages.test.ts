/// <reference types="vitest/globals" />
import { replySchema } from "./messages";
import { MESSAGE_BODY_MAX_LENGTH } from "@/lib/config/portal";

describe("replySchema", () => {
  it("accepts a valid message body", () => {
    const result = replySchema.safeParse({ body: "Hello, how are you?" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = replySchema.safeParse({ body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing body field", () => {
    const result = replySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it(`rejects body longer than ${MESSAGE_BODY_MAX_LENGTH} chars`, () => {
    const result = replySchema.safeParse({ body: "x".repeat(MESSAGE_BODY_MAX_LENGTH + 1) });
    expect(result.success).toBe(false);
  });

  it(`accepts body at exactly ${MESSAGE_BODY_MAX_LENGTH} chars`, () => {
    const result = replySchema.safeParse({ body: "x".repeat(MESSAGE_BODY_MAX_LENGTH) });
    expect(result.success).toBe(true);
  });

  it("accepts a single character body", () => {
    const result = replySchema.safeParse({ body: "." });
    expect(result.success).toBe(true);
  });

  it("accepts a multi-line body with unicode", () => {
    const result = replySchema.safeParse({ body: "Guten Tag,\n\nMeine Frage ist über ADHD-Behandlung. 🧠" });
    expect(result.success).toBe(true);
  });
});
