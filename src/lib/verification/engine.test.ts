import { describe, expect, it } from "vitest";
import { SCENARIOS } from "./scenarios";
import { runCheck } from "./engine";
import type { CheckInput } from "./types";

const base: CheckInput = {
  organization: "Google",
  counterpartyName: "",
  counterpartyEmail: "hr.google.intern@gmail.com",
  promise: "Pay a ₹1,500 refundable registration fee to confirm your internship.",
  amount: "1500",
  officialUrl: "https://www.google.com/about/careers/applications/how-we-hire/",
  evidenceText: "WhatsApp screenshot and offer PDF.",
};

describe("runCheck", () => {
  it("contradicts the fake Google internship fee with Google's own guidance", () => {
    const result = runCheck({ ...SCENARIOS.fake_internship.input });
    expect(result.outcome).toBe("CONTRADICTED");
    expect(result.decision).toBe("DO_NOT_PROCEED");
    expect(result.claims.some((claim) => claim.evidence.some((item) => item.url?.includes("support.google.com")))).toBe(true);
    expect(result.couldNotDetermine.length).toBeGreaterThan(0);
  });

  it("verifies an official page without pretending the recruiter is verified", () => {
    const result = runCheck({ ...SCENARIOS.official_page.input });
    expect(result.outcome).toBe("VERIFIED");
    expect(result.decision).toBe("PROCEED");
    expect(result.couldNotDetermine.join(" ")).toMatch(/recruiter/i);
  });

  it("returns conditions when the domain matches but the person does not", () => {
    const result = runCheck({ ...SCENARIOS.verified_recruiter.input });
    expect(result.outcome).toBe("VERIFIED_WITH_CONDITIONS");
    expect(result.decision).toBe("PROCEED_AFTER_CONDITIONS");
    expect(result.conditions.join(" ")).toMatch(/official directory/i);
  });

  it("stays undetermined for an unverifiable seller", () => {
    const result = runCheck({ ...SCENARIOS.unknown_seller.input });
    expect(result.outcome).toBe("UNDETERMINED");
    expect(result.decision).toBe("PROCEED_WITH_PROTECTION");
    expect(result.claims.every((claim) => claim.outcome !== "CONTRADICTED")).toBe(true);
  });

  it("never treats a failed match as an adverse finding", () => {
    const result = runCheck({
      ...base,
      organization: "Unknown Studio",
      counterpartyEmail: "",
      officialUrl: "",
    });
    expect(result.outcome).toBe("UNDETERMINED");
    expect(result.claims.some((claim) => claim.outcome === "CONTRADICTED")).toBe(false);
  });

  it("contradicts a fee request even when the scenario is not selected", () => {
    const result = runCheck({ ...base, scenario: undefined });
    expect(result.outcome).toBe("CONTRADICTED");
    expect(result.claims.find((claim) => claim.id === "fee")?.evidence.some((item) => item.relation === "CONTRADICTS")).toBe(true);
  });

  it("detects a fee request phrased after the amount", () => {
    const result = runCheck({
      ...base,
      scenario: undefined,
      promise: "Google wants a ₹1,500 fee to confirm the internship.",
      officialUrl: "",
      evidenceText: "",
    });
    expect(result.outcome).toBe("CONTRADICTED");
  });

  it("does not invent a contradiction for a matching official domain", () => {
    const result = runCheck({
      ...base,
      scenario: undefined,
      counterpartyEmail: "recruiter@google.com",
      promise: "A recruiter asked me to apply through the official careers site.",
      evidenceText: "",
    });
    expect(result.claims.some((claim) => claim.outcome === "CONTRADICTED")).toBe(false);
  });
});
