"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SCENARIOS, SCENARIO_LIST, runCheck } from "@/lib/verification";
import type {
  CheckInput,
  CheckResult,
  Decision,
  EvidenceTier,
  Outcome,
  ScenarioId,
} from "@/lib/verification";

const EMPTY: CheckInput = {
  organization: "",
  counterpartyName: "",
  counterpartyEmail: "",
  promise: "",
  amount: "",
  officialUrl: "",
  evidenceText: "",
};

type Field = Exclude<keyof CheckInput, "scenario">;

const OUTCOME_LABEL: Record<Outcome, string> = {
  VERIFIED: "Verified",
  VERIFIED_WITH_CONDITIONS: "Verified with conditions",
  CONTRADICTED: "Contradicted",
  UNDETERMINED: "Undetermined",
};

const DECISION_LABEL: Record<Decision, string> = {
  PROCEED: "Proceed, with the evidence recorded",
  PROCEED_AFTER_CONDITIONS: "Proceed only after the conditions are met",
  PROCEED_WITH_PROTECTION: "Do not pay unprotected. Use a protected deal",
  DO_NOT_PROCEED: "Do not proceed",
};

const TIER_LABEL: Record<EvidenceTier, string> = {
  E0: "Self-asserted",
  E1: "Platform-asserted",
  E2: "Interested third party",
  E3: "Independent",
};

function outcomeClass(outcome: Outcome) {
  return `outcome-${outcome.toLowerCase().replaceAll("_", "-")}`;
}

function Result({ result, onProtect, protectPending }: { result: CheckResult; onProtect: () => void; protectPending: boolean }) {
  return (
    <section className={`check-result ${outcomeClass(result.outcome)}`}>
      <div className="result-top">
        <span className="verdict-pill">{OUTCOME_LABEL[result.outcome]}</span>
        <span className="result-id">#{result.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <h2>{result.headline}</h2>
      <p className="result-summary">{result.summary}</p>

      <div className="decision-line">
        <span>Recommended action</span>
        <strong>{DECISION_LABEL[result.decision]}</strong>
      </div>

      <div className="coverage-row" aria-label="Evidence coverage">
        {(["E0", "E1", "E2", "E3"] as EvidenceTier[]).map((tier) => (
          <span key={tier}>
            <b>{result.coverage[tier]}</b> {tier}
          </span>
        ))}
      </div>

      <div className="result-columns">
        <div>
          <p className="card-label">WHAT WE COULD NOT DETERMINE</p>
          <ul>
            {result.couldNotDetermine.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="card-label">CONDITIONS</p>
          {result.conditions.length > 0 ? (
            <ul>
              {result.conditions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="result-none">None for this check.</p>
          )}
        </div>
      </div>

      <div className="claim-stack">
        {result.claims.map((item) => (
          <article className="claim-card" key={item.id}>
            <div className="claim-head">
              <span className={`claim-outcome ${outcomeClass(item.outcome)}`}>
                {OUTCOME_LABEL[item.outcome]}
              </span>
              <span className="claim-material">{item.material ? "MATERIAL" : "CONTEXT"}</span>
            </div>
            <h3>{item.text}</h3>
            <p>{item.rationale}</p>
            <div className="evidence-list">
              {item.evidence.map((evidence) => (
                <div className="evidence-item" key={evidence.id}>
                  <div className="evidence-meta">
                    <span className={`tier-chip tier-${evidence.tier.toLowerCase()}`}>{evidence.tier}</span>
                    <span className="timing-chip">{evidence.timing}</span>
                    <span className={`relation-chip relation-${evidence.relation.toLowerCase()}`}>
                      {evidence.relation}
                    </span>
                  </div>
                  <p>{evidence.label}</p>
                  {evidence.quote && <blockquote>“{evidence.quote}”</blockquote>}
                  {evidence.note && <small>{evidence.note}</small>}
                  {evidence.url && (
                    <a href={evidence.url} target="_blank" rel="noreferrer">
                      Open source ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {result.outcome === "CONTRADICTED" ? (
        <div className="result-blocked">
          A protected deal cannot fix a contradicted claim. Do not pay or share documents based on this offer.
        </div>
      ) : (
        <button className="button-primary form-submit protect-button" onClick={onProtect} disabled={protectPending}>
          {protectPending ? "Saving verification…" : "Protect this deal"} <span>↗</span>
        </button>
      )}

      <p className="check-disclaimer">{result.disclaimer}</p>
    </section>
  );
}

function EmptyResult() {
  return (
    <section className="check-empty">
      <p className="card-label">THE RULE</p>
      <h2>Screenshots are <em>claims,</em> not evidence.</h2>
      <p>
        TrustBridge does not ask “does this look real?” It asks what a source can prove, when it could prove it,
        and whether that is enough to rely on before money moves.
      </p>
      <div className="evidence-legend">
        {(["E0", "E1", "E2", "E3"] as EvidenceTier[]).map((tier) => (
          <div key={tier}>
            <span className={`tier-chip tier-${tier.toLowerCase()}`}>{tier}</span>
            <p><b>{TIER_LABEL[tier]}</b></p>
          </div>
        ))}
      </div>
      <div className="empty-rule">
        <span>E3 + BEFORE</span>
        <p>Material reliance needs an independent source that existed before the decision, not after it.</p>
      </div>
      <p className="check-note">
        Pick a scenario on the left, or describe a real offer. When the evidence is silent, we say so.
      </p>
    </section>
  );
}

export default function CheckForm() {
  const router = useRouter();
  const [form, setForm] = useState<CheckInput>(EMPTY);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | undefined>();
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checkedInput, setCheckedInput] = useState<CheckInput | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [protectPending, setProtectPending] = useState(false);

  function update(name: Field, value: string) {
    setForm((current) => ({ ...current, [name]: value, scenario: undefined }));
    setSelectedScenario(undefined);
    setResult(null);
    setCheckedInput(null);
  }

  function applyScenario(id: ScenarioId) {
    const preset = SCENARIOS[id];
    setForm({ ...preset.input });
    setSelectedScenario(id);
    setResult(runCheck({ ...preset.input }));
    setCheckedInput({ ...preset.input });
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload: CheckInput = { ...form, scenario: selectedScenario };

    if (!form.organization.trim() || form.promise.trim().length < 10) {
      setError("Add the organisation and a promise of at least 10 characters.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as CheckResult | { error?: string };
      if (!response.ok || !("outcome" in data)) {
        setError("error" in data && data.error ? data.error : "The check failed. Try again.");
        return;
      }
      setResult(data);
      setCheckedInput(payload);
    } catch {
      setResult(runCheck(payload));
      setCheckedInput(payload);
    } finally {
      setPending(false);
    }
  }

  async function protect() {
    setError("");
    setProtectPending(true);
    const payload = checkedInput ?? { ...form, scenario: selectedScenario };
    try {
      const response = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "Could not save the verification. Try again.");
        return;
      }
      const params = new URLSearchParams({ verificationId: data.id });
      const title = payload.promise.trim().slice(0, 120);
      const description = payload.promise.trim().slice(0, 1000);
      if (title) params.set("title", title);
      if (description) params.set("description", description);
      if (payload.amount.trim()) params.set("price", payload.amount.trim());
      router.push(`/create?${params.toString()}`);
    } catch {
      setError("Could not reach the verification service. Try again.");
    } finally {
      setProtectPending(false);
    }
  }

  return (
    <div className="check-grid">
      <section className="check-panel">
        <div className="scenario-row">
          <p className="card-label">TRY A SCENARIO</p>
          <div className="scenario-chips">
            {SCENARIO_LIST.map((scenario) => (
              <button
                type="button"
                key={scenario.id}
                className={`scenario-chip ${selectedScenario === scenario.id ? "is-active" : ""}`}
                onClick={() => applyScenario(scenario.id)}
              >
                <b>{scenario.label}</b>
                <small>{scenario.blurb}</small>
              </button>
            ))}
          </div>
        </div>

        <form className="check-form" onSubmit={submit}>
          <div className="form-two">
            <label htmlFor="organization">
              Organisation
              <input
                id="organization"
                value={form.organization}
                onChange={(event) => update("organization", event.target.value)}
                placeholder="e.g. Google"
                required
              />
            </label>
            <label htmlFor="counterparty">
              Counterparty name
              <input
                id="counterparty"
                value={form.counterpartyName}
                onChange={(event) => update("counterpartyName", event.target.value)}
                placeholder="e.g. Priya Sharma"
              />
            </label>
          </div>

          <label htmlFor="email">
            Their email
            <input
              id="email"
              type="email"
              value={form.counterpartyEmail}
              onChange={(event) => update("counterpartyEmail", event.target.value)}
              placeholder="name@company.com"
            />
          </label>

          <label htmlFor="promise">
            What did they promise?
            <textarea
              id="promise"
              rows={4}
              value={form.promise}
              onChange={(event) => update("promise", event.target.value)}
              placeholder="Paste the offer, message, or promise. Include any fee they asked for."
              required
            />
          </label>

          <div className="form-two">
            <label htmlFor="amount">
              Amount (₹)
              <input
                id="amount"
                inputMode="numeric"
                value={form.amount}
                onChange={(event) => update("amount", event.target.value)}
                placeholder="1500"
              />
            </label>
            <label htmlFor="official-url">
              Official link
              <input
                id="official-url"
                type="url"
                value={form.officialUrl}
                onChange={(event) => update("officialUrl", event.target.value)}
                placeholder="https://company.com/careers"
              />
            </label>
          </div>

          <label htmlFor="evidence">
            Evidence you were given
            <textarea
              id="evidence"
              rows={3}
              value={form.evidenceText}
              onChange={(event) => update("evidenceText", event.target.value)}
              placeholder="Screenshot, forwarded message, offer PDF, or a description."
            />
          </label>
          <p className="form-hint">
            This is recorded as E0. It proves the message exists, not that its contents are true.
          </p>

          {error && <p className="form-error">{error}</p>}

          <button className="button-primary form-submit" disabled={pending}>
            {pending ? "Checking…" : "Run verification"} <span>↗</span>
          </button>
        </form>
      </section>

      <section className="check-output">{result ? <Result result={result} onProtect={protect} protectPending={protectPending} /> : <EmptyResult />}</section>
    </div>
  );
}
