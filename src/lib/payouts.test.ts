import { describe, expect, it } from "vitest";
import { calculateFeeSplit } from "@/lib/payouts";

describe("calculateFeeSplit", () => {
  it("splits the platform fee proportionally for a 30% deposit", () => {
    expect(calculateFeeSplit(25000, 7500)).toEqual({
      totalFee: 1250,
      depositCents: 7500,
      balanceCents: 17500,
      depositFee: 375,
      balanceFee: 875,
    });
  });

  it("handles a 50/50 split", () => {
    expect(calculateFeeSplit(10000, 5000)).toEqual({
      totalFee: 500,
      depositCents: 5000,
      balanceCents: 5000,
      depositFee: 250,
      balanceFee: 250,
    });
  });

  it("falls back to a full balance release for legacy deals with no deposit", () => {
    expect(calculateFeeSplit(10000, 0)).toEqual({
      totalFee: 500,
      depositCents: 0,
      balanceCents: 10000,
      depositFee: 0,
      balanceFee: 500,
    });
  });

  it("never lets the split exceed the price", () => {
    const split = calculateFeeSplit(10000, 15000);
    expect(split.depositCents).toBe(10000);
    expect(split.balanceCents).toBe(0);
    expect(split.depositFee + split.balanceFee).toBe(split.totalFee);
  });
});
