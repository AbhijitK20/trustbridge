import { describe, expect, it } from "vitest";
import { calculatePlatformFee } from "@/lib/stripe";

describe("calculatePlatformFee", () => {
  it("rounds a percentage fee to whole cents", () => {
    expect(calculatePlatformFee(1_200_00, 5)).toBe(6_000);
  });

  it("supports zero-fee deals", () => {
    expect(calculatePlatformFee(9_999, 0)).toBe(0);
  });
});
