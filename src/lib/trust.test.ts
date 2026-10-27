import { describe, expect, it } from "vitest";
import { calculateTrustScore } from "@/lib/trust";

describe("calculateTrustScore", () => {
  it("rewards verified history and ratings", () => {
    expect(calculateTrustScore(10, [5, 5, 4], 0, 0)).toBe(86);
  });

  it("penalizes reports and refund disputes", () => {
    expect(calculateTrustScore(4, [5], 1, 1)).toBe(53);
  });

  it("never leaves the trust-score range", () => {
    expect(calculateTrustScore(0, [], 20, 20)).toBe(0);
    expect(calculateTrustScore(100, [5, 5, 5], 0, 0)).toBe(100);
  });
});
