/// <reference types="vitest/globals" />
import { bookingCreateSchema } from "./bookings";
import { BOOKING_PREFERRED_DATE_MAX_LENGTH, BOOKING_NOTES_MAX_LENGTH } from "@/lib/config/portal";

describe("bookingCreateSchema", () => {
  it("accepts an empty object (all fields optional, bookingType defaults to consultation)", () => {
    const result = bookingCreateSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bookingType).toBe("consultation");
  });

  it("accepts a valid consultation booking with all fields", () => {
    const result = bookingCreateSchema.safeParse({
      bookingType: "consultation",
      preferredDate: "2026-05-15",
      notes: "Please call in the morning.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid machine booking with machineType", () => {
    const result = bookingCreateSchema.safeParse({
      bookingType: "machine",
      machineType: "ihht",
    });
    expect(result.success).toBe(true);
  });

  it("accepts machineType null", () => {
    const result = bookingCreateSchema.safeParse({
      bookingType: "consultation",
      machineType: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid bookingType", () => {
    const result = bookingCreateSchema.safeParse({ bookingType: "surgery" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid machineType", () => {
    const result = bookingCreateSchema.safeParse({
      bookingType: "machine",
      machineType: "laser_spa",
    });
    expect(result.success).toBe(false);
  });

  it(`rejects preferredDate longer than ${BOOKING_PREFERRED_DATE_MAX_LENGTH} chars`, () => {
    const result = bookingCreateSchema.safeParse({
      preferredDate: "x".repeat(BOOKING_PREFERRED_DATE_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`accepts preferredDate at exactly ${BOOKING_PREFERRED_DATE_MAX_LENGTH} chars`, () => {
    const result = bookingCreateSchema.safeParse({
      preferredDate: "x".repeat(BOOKING_PREFERRED_DATE_MAX_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it(`rejects notes longer than ${BOOKING_NOTES_MAX_LENGTH} chars`, () => {
    const result = bookingCreateSchema.safeParse({
      notes: "n".repeat(BOOKING_NOTES_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`accepts notes at exactly ${BOOKING_NOTES_MAX_LENGTH} chars`, () => {
    const result = bookingCreateSchema.safeParse({
      notes: "n".repeat(BOOKING_NOTES_MAX_LENGTH),
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid machine types", () => {
    const validTypes = ["h2_therapy", "ihht", "pemf", "infrared", "hrv_biofeedback"];
    for (const machineType of validTypes) {
      const result = bookingCreateSchema.safeParse({ bookingType: "machine", machineType });
      expect(result.success).toBe(true);
    }
  });
});
