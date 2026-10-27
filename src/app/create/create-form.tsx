"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CheckResult, Outcome } from "@/lib/verification";

type AttachedVerification = {
  id: string;
  outcome: Outcome;
  headline: string;
  summary: string;
  organization: string;
};

function outcomeClass(outcome: Outcome) {
  return `outcome-${outcome.toLowerCase().replaceAll("_", "-")}`;
}

export default function CreateDealForm({
  verificationId,
  initialTitle,
  initialDescription,
  initialPrice,
}: {
  verificationId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialPrice?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [verification, setVerification] = useState<AttachedVerification | null>(null);
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    if (!verificationId) return;
    let alive = true;

    (async () => {
      try {
        const response = await fetch(`/api/verification/${verificationId}`);
        const data = (await response.json()) as { error?: string; organization?: string; result?: CheckResult };
        if (!response.ok || !data.result) throw new Error(data.error ?? "Verification not found.");
        if (!alive) return;
        setVerification({
          id: verificationId,
          outcome: data.result.outcome,
          headline: data.result.headline,
          summary: data.result.summary,
          organization: data.organization ?? "the organisation",
        });
      } catch (cause) {
        if (alive) setVerificationError(cause instanceof Error ? cause.message : "Could not load the verification.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [verificationId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setError("Agree to the Terms and Privacy Policy before creating the deal.");
      return;
    }
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const price = Number(form.get("price"));
    const response = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        priceCents: Math.round(price * 100),
        depositPercent: Number(form.get("depositPercent") || 30),
        currency: form.get("currency") || "inr",
        sellerName: form.get("sellerName"),
        deliveryDeadline: form.get("deadline") ? new Date(`${form.get("deadline")}T23:59:00`).toISOString() : undefined,
        verificationId: form.get("verificationId") || undefined,
        consent: true,
      }),
    });
    const body = (await response.json()) as { error?: string; token?: string };
    if (!response.ok || !body.token) {
      setError(body.error ?? "Something went wrong.");
      setPending(false);
      return;
    }
    router.push(`/deal/${body.token}?created=1`);
  }

  const blocked = verification?.outcome === "CONTRADICTED";

  return (
    <main className="form-page">
      <div className="form-intro">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <p className="eyebrow">Start a protected deal</p>
        <h1>Put the agreement<br /><em>in writing.</em></h1>
        <p>One link. Clear deliverables. Payment protected until the work is delivered.</p>
      </div>
      <form className="deal-form" onSubmit={submit}>
        {verification && (
          <div className={`attached-check ${outcomeClass(verification.outcome)}`}>
            <span className="verdict-pill">
              Attached check · {verification.outcome.replaceAll("_", " ")}
            </span>
            <p>{verification.headline}</p>
            <small>{verification.summary} Checked against {verification.organization}.</small>
          </div>
        )}
        {verificationError && <p className="form-error">{verificationError}</p>}

        <input type="hidden" name="verificationId" value={verificationId ?? ""} />

        <label htmlFor="title">
          What are you buying?
          <input id="title" name="title" required defaultValue={initialTitle} placeholder="e.g. Brand identity & launch kit" />
        </label>
        <label htmlFor="description">
          Describe the deliverable
          <textarea
            id="description"
            name="description"
            required
            minLength={10}
            defaultValue={initialDescription}
            placeholder="Be specific. What files, outcomes, or access should be delivered?"
            rows={5}
          />
        </label>
        <div className="form-two">
          <label htmlFor="price">
            Agreed price
            <span className="price-row">
              <input id="price" name="price" required min="1" step="0.01" type="number" defaultValue={initialPrice} placeholder="1200.00" />
              <select name="currency" defaultValue="inr" aria-label="Currency">
                <option value="inr">INR ₹</option>
                <option value="usd">USD $</option>
              </select>
            </span>
          </label>
          <label htmlFor="deadline">
            Delivery by
            <input id="deadline" name="deadline" type="date" />
          </label>
        </div>
        <label htmlFor="depositPercent">
          Deposit schedule
          <select id="depositPercent" name="depositPercent" defaultValue="30">
            <option value="30">30% at delivery · 70% on acceptance</option>
            <option value="50">50% at delivery · 50% on acceptance</option>
            <option value="100">100% on acceptance</option>
          </select>
        </label>
        <p className="form-hint">The full amount is held. The deposit releases when delivery is submitted; the balance releases when you accept.</p>
        <div className="form-divider" />
        <p className="form-label">Seller details</p>
        <label htmlFor="sellerName">
          Name
          <input id="sellerName" name="sellerName" required placeholder="Seller or studio name" />
        </label>

        <label className="consent-check">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>
            I agree to the <Link href="/legal/terms" target="_blank">Terms</Link> and{" "}
            <Link href="/legal/privacy" target="_blank">Privacy Policy</Link> on behalf of the seller.
          </span>
        </label>

        {error && <p className="form-error">{error}</p>}

        {blocked ? (
          <p className="form-error">
            This verification contradicted a material claim. Do not create a protected deal based on this offer.
          </p>
        ) : (
          <button className="button-primary form-submit" disabled={pending || !consent}>
            {pending ? "Creating deal…" : "Create protected deal ↗"}
          </button>
        )}
        <p className="form-footnote">
          No payment is taken when creating a deal. You&apos;ll share the link with the buyer or seller first.
        </p>
      </form>
    </main>
  );
}
