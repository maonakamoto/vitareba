/// <reference types="vitest/globals" />
import { getAdminEmails } from "./company";

const ORIGINAL = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = ORIGINAL;
});

describe("getAdminEmails", () => {
  it("returns an empty array when env var is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(getAdminEmails()).toEqual([]);
  });

  it("returns an empty array when env var is empty", () => {
    process.env.ADMIN_EMAILS = "";
    expect(getAdminEmails()).toEqual([]);
  });

  it("parses a single email", () => {
    process.env.ADMIN_EMAILS = "manuel@example.com";
    expect(getAdminEmails()).toEqual(["manuel@example.com"]);
  });

  it("parses a comma-separated list", () => {
    process.env.ADMIN_EMAILS = "a@x.com,b@x.com,c@x.com";
    expect(getAdminEmails()).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("trims surrounding whitespace per entry", () => {
    process.env.ADMIN_EMAILS = " a@x.com , b@x.com ";
    expect(getAdminEmails()).toEqual(["a@x.com", "b@x.com"]);
  });

  it("filters out empty entries from trailing commas / double commas", () => {
    process.env.ADMIN_EMAILS = "a@x.com,,b@x.com,";
    expect(getAdminEmails()).toEqual(["a@x.com", "b@x.com"]);
  });

  it("lowercases entries (regression: case-mixed env should not double-email)", () => {
    process.env.ADMIN_EMAILS = "Manuel@X.com,manuel@x.com";
    expect(getAdminEmails()).toEqual(["manuel@x.com"]);
  });

  it("dedupes after lowercasing", () => {
    process.env.ADMIN_EMAILS = "a@x.com, A@X.com, a@x.com, b@x.com";
    expect(getAdminEmails()).toEqual(["a@x.com", "b@x.com"]);
  });

  it("preserves order of first occurrence", () => {
    process.env.ADMIN_EMAILS = "z@x.com,a@x.com,Z@x.com";
    expect(getAdminEmails()).toEqual(["z@x.com", "a@x.com"]);
  });
});
