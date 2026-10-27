"use client";

import { useState } from "react";
import Link from "next/link";
import type { CheckResult } from "@/lib/verification";

export type Delivery = {
  id: string;
  publicToken: string;
  title: string;
  description: string;
  priceCents: number;
  depositCents: number;
  balanceCents: number;
  currency: string;
  updatedAt: Date;
  seller: { name: string | null; email: string };
  buyer: { name: string | null; email: string } | null;
  evidence: { id: string; fileName: string; note: string | null; storageKey: string | null; sha256: string | null; aiVerdict: string | null }[];
  verificationCheck: { id: string; outcome: string; result: unknown } | null;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
}

function triage(delivery: Delivery) {
  const outcome = delivery.verificationCheck?.outcome;
  if (outcome === "CONTRADICTED") return { label: "High risk", detail: "The attached verification contradicted a material claim." };
  if (outcome === "VERIFIED") return { label: "Low risk", detail: "The attached verification was supported by independent evidence." };
  if (outcome === "VERIFIED_WITH_CONDITIONS") return { label: "Conditions open", detail: "The attached verification left conditions open." };
  if (outcome === "UNDETERMINED") return { label: "Human review", detail: "The attached verification could not determine the claim." };
  return { label: "Human review", detail: "No verification is attached to this deal." };
}

function DeliveryCard({ delivery, onResolved }: { delivery: Delivery; onResolved: (id: string) => void }) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const signal = triage(delivery);
  const report = delivery.verificationCheck?.result as CheckResult | undefined;

  async function act(action: "ACCEPT" | "REFUND" | "DISPUTE") {
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const body = (await response.json()) as { error?: string; message?: string; status?: string };
    if (!response.ok) {
      setError(body.error ?? "The delivery action failed.");
      setPending(false);
      return;
    }
    if (body.status === "PENDING_SECOND_APPROVAL") {
      setNotice(body.message ?? "High-value delivery decision is awaiting a second reviewer.");
      setPending(false);
      return;
    }
    setNotice(body.message ?? "Decision recorded.");
    setPending(false);
    if (action !== "DISPUTE") onResolved(delivery.id);
  }

  return (
    <article className="delivery-card">
      <div className="delivery-head">
        <div>
          <p className="card-label">DELIVERY TICKET</p>
          <h2>{delivery.title}</h2>
          <Link className="verification-report-link" href={`/deal/${delivery.publicToken}`}>Open deal ↗</Link>
        </div>
        <span className={`delivery-triage triage-${signal.label.toLowerCase().replaceAll(" ", "-")}`}>
          {signal.label}
        </span>
      </div>
      <p className="delivery-triage-detail">{signal.detail}</p>

      <div className="delivery-grid">
        <div>
          <p className="card-label">DEAL</p>
          <p>{delivery.description}</p>
          <small>
            Seller: {delivery.seller.name ?? delivery.seller.email}
            <br />
            Buyer: {delivery.buyer?.name ?? delivery.buyer?.email ?? "Unknown"}
            <br />
            Deposit {money(delivery.depositCents, delivery.currency)} · Balance {money(delivery.balanceCents, delivery.currency)}
          </small>
        </div>
        <div>
          <p className="card-label">DELIVERY EVIDENCE</p>
          {delivery.evidence.length === 0 && <p className="result-none">No evidence attached.</p>}
          {delivery.evidence.map((evidence) => (
            <div className="evidence-row" key={evidence.id}>
              {evidence.storageKey ? (
                <a href={`/api/evidence/${evidence.id}/download`}>{evidence.fileName} ↗</a>
              ) : (
                <span>{evidence.fileName}</span>
              )}
              <small>{evidence.note ?? "No note attached."}</small>
              {evidence.aiVerdict && <small>Auto triage: {evidence.aiVerdict.replaceAll("_", " ").toLowerCase()}</small>}
              {evidence.sha256 && <small>SHA-256 {evidence.sha256.slice(0, 10)}…</small>}
            </div>
          ))}
        </div>
      </div>

      {delivery.verificationCheck && report && (
        <div className={`delivery-verification outcome-${delivery.verificationCheck.outcome.toLowerCase().replaceAll("_", "-")}`}>
          <div className="dispute-verification-head">
            <div>
              <p className="card-label">ATTACHED VERIFICATION</p>
              <span className="verdict-pill">{delivery.verificationCheck.outcome.replaceAll("_", " ")}</span>
            </div>
            <Link className="verification-report-link" href={`/verification/${delivery.verificationCheck.id}`}>Full report ↗</Link>
          </div>
          <p className="workflow-title">{report.headline}</p>
          <p className="muted">{report.summary}</p>
        </div>
      )}

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Decision note (minimum 10 characters for reject or dispute)"
        rows={3}
      />
      <div className="delivery-actions">
        <button className="button-primary" onClick={() => act("ACCEPT")} disabled={pending}>
          Accept & release balance
        </button>
        <button className="button-danger" onClick={() => act("REFUND")} disabled={pending || note.length < 10}>
          Refund buyer
        </button>
        <button className="button-light" onClick={() => act("DISPUTE")} disabled={pending || note.length < 10}>
          Escalate to dispute
        </button>
      </div>
      {notice && <p className="form-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
    </article>
  );
}

export default function DeliveryQueue({ deliveries: initial }: { deliveries: Delivery[] }) {
  const [deliveries, setDeliveries] = useState(initial);

  if (deliveries.length === 0) return null;

  return (
    <section className="delivery-section">
      <div className="delivery-section-head">
        <div>
          <p className="eyebrow">Delivery review</p>
          <h2>Release the next <em>slice.</em></h2>
          <p>Evidence, the attached verification, and the deposit/balance split. Accept, refund, or escalate.</p>
        </div>
        <span className="delivery-count">{deliveries.length} waiting</span>
      </div>
      <div className="delivery-list">
        {deliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            delivery={delivery}
            onResolved={(id) => setDeliveries((items) => items.filter((item) => item.id !== id))}
          />
        ))}
      </div>
    </section>
  );
}
