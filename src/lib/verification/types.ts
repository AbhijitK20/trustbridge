export type Outcome = "VERIFIED" | "VERIFIED_WITH_CONDITIONS" | "CONTRADICTED" | "UNDETERMINED";

export type Decision = "PROCEED" | "PROCEED_AFTER_CONDITIONS" | "PROCEED_WITH_PROTECTION" | "DO_NOT_PROCEED";

export type EvidenceTier = "E0" | "E1" | "E2" | "E3";

export type EvidenceTiming = "BEFORE" | "DURING" | "AFTER";

export type EvidenceRelation = "SUPPORTS" | "CONTRADICTS" | "NEUTRAL";

export type EvidenceRef = {
  id: string;
  tier: EvidenceTier;
  timing: EvidenceTiming;
  label: string;
  relation: EvidenceRelation;
  url?: string;
  quote?: string;
  note?: string;
};

export type Claim = {
  id: string;
  text: string;
  material: boolean;
  outcome: Outcome;
  rationale: string;
  evidence: EvidenceRef[];
  conditions: string[];
  couldNotDetermine: string[];
};

export type ScenarioId = "fake_internship" | "official_page" | "verified_recruiter" | "unknown_seller";

export type CheckInput = {
  scenario?: ScenarioId;
  organization: string;
  counterpartyName: string;
  counterpartyEmail: string;
  promise: string;
  amount: string;
  officialUrl: string;
  evidenceText: string;
};

export type CheckResult = {
  id: string;
  checkedAt: string;
  outcome: Outcome;
  decision: Decision;
  headline: string;
  summary: string;
  claims: Claim[];
  conditions: string[];
  couldNotDetermine: string[];
  coverage: Record<EvidenceTier, number>;
  disclaimer: string;
};

export type Scenario = {
  label: string;
  blurb: string;
  input: CheckInput;
  claims: Claim[];
};
