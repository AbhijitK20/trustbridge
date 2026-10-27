import { SCENARIOS } from "./scenarios";
import type {
  CheckInput,
  CheckResult,
  Claim,
  Decision,
  EvidenceRef,
  EvidenceTier,
  Outcome,
} from "./types";

type PolicyFact = {
  label: string;
  url: string;
  quote: string;
};

type KnownOrg = {
  keys: string[];
  domains: string[];
  paths?: string[];
  policy?: PolicyFact;
};

const GOOGLE_SCAMS: PolicyFact = {
  label: "Google Help — Avoid and report scams",
  url: "https://support.google.com/faqs/answer/2952493",
  quote:
    "No reputable person or agency will ever demand payment or your personal information on the spot.",
};

const KNOWN_ORGS: KnownOrg[] = [
  { keys: ["google", "alphabet"], domains: ["google.com"], paths: ["/about/careers/"], policy: GOOGLE_SCAMS },
  { keys: ["microsoft"], domains: ["microsoft.com"], paths: [] },
  { keys: ["amazon"], domains: ["amazon.com", "amazon.in"], paths: [] },
  { keys: ["meta", "facebook"], domains: ["meta.com", "facebook.com"], paths: [] },
  { keys: ["apple"], domains: ["apple.com"], paths: [] },
  { keys: ["flipkart"], domains: ["flipkart.com"], paths: [] },
  { keys: ["infosys"], domains: ["infosys.com"], paths: [] },
  { keys: ["tcs", "tata consultancy"], domains: ["tcs.com"], paths: [] },
  { keys: ["wipro"], domains: ["wipro.com"], paths: [] },
];

const FEE_PATTERN =
  /(registration fee|security deposit|processing fee|refundable (?:fee|deposit|amount)|pay (?:₹|rs\.?|inr|\$)?\s?[\d,]+|(?:fee|deposit)[^.]{0,60}(?:confirm|joining|start|onboard)|(?:₹|rs\.?|inr|\$)\s?[\d,]+[^.]{0,30}\bfee\b)/i;

const NO_FEE_PATTERN =
  /\bno\s+fee\b|\bwithout\s+(?:a\s+)?fee\b|\bnever\s+(?:pay|send)\b|\bdoes not require\b|\bfree\s+of\s+charge\b/i;

const OUTCOME_COPY: Record<Outcome, { headline: string; decision: Decision }> = {
  CONTRADICTED: {
    headline: "Do not proceed. A material claim is contradicted.",
    decision: "DO_NOT_PROCEED",
  },
  UNDETERMINED: {
    headline: "We can't verify this yet. Protect the deal instead.",
    decision: "PROCEED_WITH_PROTECTION",
  },
  VERIFIED_WITH_CONDITIONS: {
    headline: "Mostly supported, with conditions.",
    decision: "PROCEED_AFTER_CONDITIONS",
  },
  VERIFIED: {
    headline: "Supported by independent evidence.",
    decision: "PROCEED",
  },
};

const DISCLAIMER =
  "TrustBridge is a verification aid, not a background check, legal advice, or a guarantee. It does not hold or move money in this demo. A human decides any dispute.";

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function checkId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function findOrg(organization: string) {
  const text = organization.trim().toLowerCase();
  return KNOWN_ORGS.find((org) => org.keys.some((key) => text.includes(key)));
}

function hostMatches(host: string, domains: string[]) {
  const clean = host.trim().toLowerCase().replace(/^www\./, "");
  return domains.some((domain) => clean === domain || clean.endsWith(`.${domain}`));
}

function urlHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function pathMatches(url: string, paths?: string[]) {
  if (!paths || paths.length === 0) return true;
  try {
    const path = new URL(url).pathname;
    return paths.some((prefix) => path.startsWith(prefix));
  } catch {
    return false;
  }
}

function emailDomain(email: string) {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).trim().toLowerCase();
}

function requestsFee(text: string) {
  return FEE_PATTERN.test(text) && !NO_FEE_PATTERN.test(text);
}

function aggregate(claims: Claim[]): Outcome {
  const material = claims.filter((claim) => claim.material);
  if (material.some((claim) => claim.outcome === "CONTRADICTED")) return "CONTRADICTED";
  if (material.some((claim) => claim.outcome === "UNDETERMINED")) return "UNDETERMINED";
  if (material.some((claim) => claim.outcome === "VERIFIED_WITH_CONDITIONS")) return "VERIFIED_WITH_CONDITIONS";
  if (claims.some((claim) => claim.conditions.length > 0)) return "VERIFIED_WITH_CONDITIONS";
  return "VERIFIED";
}

function claim(
  id: string,
  text: string,
  material: boolean,
  outcome: Outcome,
  rationale: string,
  evidence: EvidenceRef[],
  conditions: string[] = [],
  couldNotDetermine: string[] = [],
): Claim {
  return { id, text, material, outcome, rationale, evidence, conditions, couldNotDetermine };
}

function screenshotEvidence(input: CheckInput): EvidenceRef | null {
  if (!input.evidenceText.trim()) return null;
  return {
    id: "screenshot",
    tier: "E0",
    timing: "BEFORE",
    label: "Message, screenshot, or document supplied by the requester",
    relation: "SUPPORTS",
    note: "Self-asserted. It proves the message exists, not that its contents are true.",
  };
}

function buildGenericClaims(input: CheckInput): Claim[] {
  const orgLabel = input.organization.trim() || "the organisation";
  const known = findOrg(input.organization);
  const domain = emailDomain(input.counterpartyEmail);
  const screenshot = screenshotEvidence(input);
  const claims: Claim[] = [];

  if (domain && known) {
    const matches = hostMatches(domain, known.domains);
    claims.push(
      claim(
        "identity",
        `The sender is authorised to act for ${orgLabel}.`,
        true,
        matches ? "VERIFIED_WITH_CONDITIONS" : "UNDETERMINED",
        matches
          ? `The sender's address ends in ${domain}, which is an official domain for ${orgLabel}. A matching domain supports the organisation link, but does not prove the individual's authority.`
          : `The sender uses ${domain}, which is not an official domain for ${orgLabel}. A personal address is not proof of impersonation, but it cannot establish authorisation.`,
        [
          {
            id: "sender-email",
            tier: "E1",
            timing: "BEFORE",
            label: `Sender email: ${input.counterpartyEmail}`,
            relation: matches ? "SUPPORTS" : "NEUTRAL",
            note: "Platform-asserted address.",
          },
          {
            id: "official-domain",
            tier: "E3",
            timing: "BEFORE",
            label: `${orgLabel}'s published domain: ${known.domains[0]}`,
            relation: "SUPPORTS",
            url: `https://${known.domains[0]}`,
          },
          ...(screenshot ? [screenshot] : []),
        ],
        matches
          ? ["Confirm the sender's name and role through a second official channel before sharing documents or money."]
          : ["Ask the sender to write from an official domain, or verify the person through the organisation's published contact channel."],
        ["Whether this specific person is employed or authorised by the organisation"],
      ),
    );
  } else {
    claims.push(
      claim(
        "identity",
        `The sender is authorised to act for ${orgLabel}.`,
        true,
        "UNDETERMINED",
        domain
          ? `No known official domain is on file for ${orgLabel}, so the address ${domain} cannot be matched against one.`
          : "No sender email or official domain was provided, so the identity claim cannot be checked.",
        [
          ...(domain
            ? [
                {
                  id: "sender-email",
                  tier: "E1" as const,
                  timing: "BEFORE" as const,
                  label: `Sender email: ${input.counterpartyEmail}`,
                  relation: "NEUTRAL" as const,
                  note: "Platform-asserted address. No official domain to compare it with.",
                },
              ]
            : []),
          ...(screenshot ? [screenshot] : []),
        ],
        ["Verify the person through the organisation's official website or a published phone number."],
        ["Whether the sender is employed or authorised by the organisation"],
      ),
    );
  }

  const textToScan = `${input.promise} ${input.evidenceText}`;
  if (requestsFee(textToScan)) {
    const policy = known?.policy;
    claims.push(
      claim(
        "fee",
        `The sender requires an upfront fee before delivering the promise.`,
        true,
        policy ? "CONTRADICTED" : "UNDETERMINED",
        policy
          ? `${orgLabel}'s own published guidance contradicts the idea that a reputable agency demands payment on the spot. The fee request is therefore contradicted by a first-party source.`
          : "The message asks for an upfront fee. No independent source confirms that this fee is legitimate.",
        [
          ...(screenshot ? [screenshot] : []),
          ...(policy
            ? [
                {
                  id: "policy",
                  tier: "E3" as const,
                  timing: "BEFORE" as const,
                  label: policy.label,
                  relation: "CONTRADICTS" as const,
                  url: policy.url,
                  quote: policy.quote,
                },
              ]
            : []),
        ],
        policy
          ? []
          : ["Do not pay any fee to receive a job, contract, or refund. Confirm fees in writing through the organisation's official channel."],
        ["Whether any legitimate fee exists outside this message"],
      ),
    );
  }

  if (input.officialUrl.trim() && known) {
    const host = urlHost(input.officialUrl);
    const official = hostMatches(host, known.domains) && pathMatches(input.officialUrl, known.paths);
    claims.push(
      claim(
        "official-link",
        `The provided link is on ${orgLabel}'s official website.`,
        true,
        official ? "VERIFIED" : "UNDETERMINED",
        official
          ? `The link host is ${host}, and the path is within ${orgLabel}'s published careers section. The host matches the organisation's official domain.`
          : `The link host is ${host || "unparseable"}. It does not match ${orgLabel}'s published domain${known.paths?.length ? " and expected path" : ""}, so it cannot be treated as an official page.`,
        [
          {
            id: "link",
            tier: "E3",
            timing: "BEFORE",
            label: `Link under review: ${input.officialUrl}`,
            relation: official ? "SUPPORTS" : "NEUTRAL",
            note: "The host was compared with the organisation's published domain. Page content was not independently captured.",
          },
        ],
        official ? [] : ["Do not use the link. Reach the page from the organisation's official homepage instead."],
        official ? ["Whether the page content itself is current and unmodified"] : ["Whether the link is an official page under a different domain"],
      ),
    );
  }

  if (input.promise.trim()) {
    claims.push(
      claim(
        "delivery",
        `The counterparty will deliver: ${input.promise.trim()}`,
        true,
        "UNDETERMINED",
        "Future performance cannot be verified before it happens. A promise is not evidence of capability or intent.",
        screenshot ? [screenshot] : [],
        [
          "Write the deliverable, deadline, and acceptance criteria into a protected deal.",
          "Release payment only after you inspect the delivery.",
        ],
        ["Whether the counterparty will perform as promised"],
      ),
    );
  }

  return claims;
}

function cloneClaims(claims: Claim[]): Claim[] {
  return claims.map((item) => ({
    ...item,
    evidence: item.evidence.map((evidence) => ({ ...evidence })),
    conditions: [...item.conditions],
    couldNotDetermine: [...item.couldNotDetermine],
  }));
}

function scenarioMatches(input: CheckInput, preset: CheckInput) {
  return (
    input.organization.trim().toLowerCase() === preset.organization.trim().toLowerCase() &&
    input.counterpartyEmail.trim().toLowerCase() === preset.counterpartyEmail.trim().toLowerCase() &&
    input.promise.trim() === preset.promise.trim() &&
    input.officialUrl.trim() === preset.officialUrl.trim()
  );
}

function buildResult(claims: Claim[]): CheckResult {
  const outcome = aggregate(claims);
  const copy = OUTCOME_COPY[outcome];
  const contradicted = claims.find((item) => item.outcome === "CONTRADICTED");
  const unresolved = claims.filter((item) => item.material && item.outcome === "UNDETERMINED");
  const contradictionSource = contradicted?.evidence.find((item) => item.relation === "CONTRADICTS");

  const summary =
    outcome === "CONTRADICTED"
      ? `“${contradicted?.text ?? "A material claim"}” is contradicted by ${contradictionSource?.label ?? "an independent source"}. Do not pay or share documents based on this claim.`
      : outcome === "UNDETERMINED"
        ? `${unresolved.length} material claim${unresolved.length === 1 ? "" : "s"} remain unresolved. That is not proof of fraud — it means you should not pay unprotected.`
        : outcome === "VERIFIED_WITH_CONDITIONS"
          ? "The checkable claims are supported. The remaining uncertainty is listed below, along with the steps that reduce it."
          : "Every material claim in this check is supported by an independent source. This does not guarantee future performance.";

  const coverage: Record<EvidenceTier, number> = { E0: 0, E1: 0, E2: 0, E3: 0 };
  for (const item of claims) {
    for (const evidence of item.evidence) coverage[evidence.tier] += 1;
  }

  return {
    id: checkId(),
    checkedAt: new Date().toISOString(),
    outcome,
    decision: copy.decision,
    headline: copy.headline,
    summary,
    claims,
    conditions: unique(claims.flatMap((item) => item.conditions)),
    couldNotDetermine: unique([
      ...claims.flatMap((item) => item.couldNotDetermine),
      "What this check did not cover: claims you did not submit, and events after the check.",
    ]),
    coverage,
    disclaimer: DISCLAIMER,
  };
}

export function runCheck(input: CheckInput): CheckResult {
  const preset = input.scenario ? SCENARIOS[input.scenario] : undefined;
  const claims = preset && scenarioMatches(input, preset.input) ? cloneClaims(preset.claims) : buildGenericClaims(input);
  return buildResult(claims);
}
