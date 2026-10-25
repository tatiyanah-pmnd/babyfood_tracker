import { describe, expect, it } from "vitest";
import { formatAge } from "./babies";

describe("formatAge", () => {
  it("affiche mois et jours", () => {
    expect(formatAge("2026-03-13", new Date("2026-10-25T12:00:00"))).toBe("7 mois et 12 jours");
  });
  it("affiche les jours avant un mois", () => {
    expect(formatAge("2026-10-20", new Date("2026-10-25T12:00:00"))).toBe("5 jours");
  });
});
