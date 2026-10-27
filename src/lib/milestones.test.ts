import { describe, expect, it } from "vitest";
import { milestoneProgress, totalMilestoneCents, validateMilestoneDrafts } from "@/lib/milestones";

const draft = {
  title: "Design",
  description: "Homepage",
  acceptanceCriteria: "Buyer approves the homepage",
  amountCents: 50000,
};

describe("milestone validation", () => {
  it("accepts a total that matches the deal price", () => {
    expect(validateMilestoneDrafts(100000, [draft, { ...draft, title: "Build", amountCents: 50000 }])).toBeNull();
  });

  it("rejects a total that does not match", () => {
    expect(validateMilestoneDrafts(100000, [draft])).toMatch(/add up/i);
  });

  it("rejects non-positive amounts", () => {
    expect(validateMilestoneDrafts(0, [{ ...draft, amountCents: 0 }])).toMatch(/positive/i);
  });

  it("rejects more than eight milestones", () => {
    expect(validateMilestoneDrafts(800, Array.from({ length: 9 }, () => ({ ...draft, amountCents: 100 })))).toMatch(/at most 8/i);
  });
});

describe("milestone progress", () => {
  it("calculates released, remaining, and percentage", () => {
    const result = milestoneProgress([
      { amountCents: 10000, status: "RELEASED" },
      { amountCents: 20000, status: "SUBMITTED" },
      { amountCents: 70000, status: "PENDING" },
    ]);
    expect(result).toMatchObject({
      totalCents: 100000,
      releasedCents: 10000,
      remainingCents: 90000,
      releasedCount: 1,
      count: 3,
      percent: 10,
    });
    expect(totalMilestoneCents([{ amountCents: 100 }, { amountCents: 200 }])).toBe(300);
  });
});
