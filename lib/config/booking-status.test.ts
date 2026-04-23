import { describe, it, expect } from "vitest";
import {
  BOOKING_STATUS_VALUES,
  BOOKING_STATUS,
  BOOKING_STATUS_CONFIG,
  type BookingStatus,
} from "./booking-status";

describe("BOOKING_STATUS config integrity", () => {
  it("BOOKING_STATUS has an entry for every BOOKING_STATUS_VALUES item", () => {
    for (const status of BOOKING_STATUS_VALUES) {
      expect(BOOKING_STATUS).toHaveProperty(status);
      expect(BOOKING_STATUS[status]).toBe(status);
    }
  });

  it("BOOKING_STATUS_CONFIG has an entry for every BOOKING_STATUS_VALUES item", () => {
    for (const status of BOOKING_STATUS_VALUES) {
      expect(BOOKING_STATUS_CONFIG).toHaveProperty(status);
    }
  });

  it("every BOOKING_STATUS_CONFIG entry has color and bg fields", () => {
    for (const status of BOOKING_STATUS_VALUES) {
      const cfg = BOOKING_STATUS_CONFIG[status as BookingStatus];
      expect(cfg).toHaveProperty("color");
      expect(cfg).toHaveProperty("bg");
      expect(typeof cfg.color).toBe("string");
      expect(typeof cfg.bg).toBe("string");
    }
  });

  it("BOOKING_STATUS_VALUES covers pending, confirmed, attended, cancelled", () => {
    const set = new Set(BOOKING_STATUS_VALUES);
    expect(set.has("pending")).toBe(true);
    expect(set.has("confirmed")).toBe(true);
    expect(set.has("attended")).toBe(true);
    expect(set.has("cancelled")).toBe(true);
  });

  it("BOOKING_STATUS_CONFIG has no extra keys beyond BOOKING_STATUS_VALUES", () => {
    const configKeys = Object.keys(BOOKING_STATUS_CONFIG).sort();
    const valuesKeys = [...BOOKING_STATUS_VALUES].sort();
    expect(configKeys).toEqual(valuesKeys);
  });
});
