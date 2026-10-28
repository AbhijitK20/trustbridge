"use client";

import { useState } from "react";
import Link from "next/link";
import AdminNav from "../admin-nav";
import type { CheckResult } from "@/lib/verification";
import DeliveryQueue, { type Delivery } from "./delivery-queue";

type Dispute = {
  id: string;
  reason: string;
  createdAt: Date;
  reporter: { email: string; name: string | null };
  deal: {
    id: string;
    publicToken: string;
    title: string;
    description: string;
    priceCents: number;
    depositCents: number;
    balanceCents: number;
    currency: string;
    status: string;
    seller: { email: string; name: string | null };
    sellerProfile: { kyc: { kycStatus: string; sanctionsStatus: string; legalName: string | null; payoutAccountName: string | null } | null };
    buyer: { email: string; name: string | null } | null;
    verificationCheck: {
      id: string;
      outcome: string;
      decision: string;
      organization: string;
      createdAt: Date;
      result: unknown;
    } | null;
    auditEvents: {
      id: string;
      metadata: unknown;
      createdAt: Date;
      actor: { name: string | null; email: string } | null;
    }[];
    evidence: {
      id: string;
      fileName: string;
      storageKey: string | null;
      note: string | null;
      sha256: string | null;
      aiVerdict: string | null;
      aiConfidence: number | null;
    }[];
  };
};

export default function DisputeQueue({ disputes: initial, deliveries, demoMode = false }: { disputes: Dispute[]; deliveries: Delivery[]; demoMode?: boolean }) {
  const [disputes, setDisputes] = useState(initial);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState("");

  async function resolve(id: string, resolution: "REFUND_TO_BUYER" | "RELEASE_TO_SELLER") {
    setPending(id);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/disputes/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution, note }),
    });
    const body = (await response.json()) as { error?: string; status?: string; simulated?: boolean; message?: string };
    if (!response.ok) {
      setError(body.error ?? "Resolution failed.");
    } else if (body.status === "PENDING_SECOND_APPROVAL") {
      setNotice(body.message ?? "High-value decision is awaiting a second reviewer.");
    } else {
      setDisputes((items) => items.filter((item) => item.id !== id));
      setNotice(
        body.simulated
          ? `Decision recorded in the sandbox ledger: ${body.status}. No real money moved.`
          : `Decision recorded: ${body.status}.`,
      );
      setNote("");
    }
    setPending("");
  }

  return (
    <main className="admin-page">
            <AdminNav section="dispute desk" />
      <header className="admin-header">
        <p className="eyebrow">Human review required</p>
        <h1>Protect the <em>decision.</em></h1>
        <p>Every dispute is a judgment call. Read the agreement, inspect evidence, and record why you decided.</p>
      </header>

      {demoMode && (
        <p className="demo-banner">Sandbox ledger: decisions update this workspace, but no real money moves.</p>
      )}
      {notice && <p className="form-success admin-notice">{notice}</p>}
      {error && <p className="form-error admin-notice">{error}</p>}

      <DeliveryQueue deliveries={deliveries} />

      {disputes.length === 0 ? (
        <section className="empty-state">
          <h2>Clear desk.</h2>
          <p>No open disputes need your attention.</p>
        </section>
      ) : (
        <section className="dispute-list">
          {disputes.map((item) => (
            <article className="dispute-card" key={item.id}>
              <div className="dispute-meta">
                <span className="status-pill"><b /> Open dispute</span>
                <span className="small-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="dispute-title-row">
                <h2>{item.deal.title}</h2>
                <Link className="verification-report-link" href={`/deal/${item.deal.publicToken}`}>Open deal ↗</Link>
              </div>
              <p className="dispute-reason">“{item.reason}”</p>
              {(() => {
                const flags: Array<{ label: string; tone: string }> = [];
                if (item.deal.verificationCheck?.outcome === "CONTRADICTED") flags.push({ label: "Verification contradicted", tone: "high" });
                else if (item.deal.verificationCheck?.outcome === "UNDETERMINED") flags.push({ label: "Verification undetermined", tone: "warn" });
                if (item.deal.sellerProfile.kyc?.kycStatus !== "VERIFIED") flags.push({ label: "KYC not verified", tone: "warn" });
                if (item.deal.sellerProfile.kyc?.sanctionsStatus && item.deal.sellerProfile.kyc.sanctionsStatus !== "CLEAR") flags.push({ label: `Sanctions ${item.deal.sellerProfile.kyc.sanctionsStatus.toLowerCase()}`, tone: "high" });
                if (item.deal.evidence.length === 0) flags.push({ label: "No evidence attached", tone: "warn" });
                if (item.deal.priceCents >= 1_000_000) flags.push({ label: "High-value deal", tone: "warn" });
                if (flags.length === 0) return null;
                return <div className="risk-flags">{flags.slice(0, 4).map((flag) => <span key={flag.label} className={`risk-flag risk-${flag.tone}`}>{flag.label}</span>)}</div>;
              })()}
              {item.deal.verificationCheck && (() => {
                const report = item.deal.verificationCheck.result as CheckResult;
                const outcome = item.deal.verificationCheck.outcome.toLowerCase().replaceAll("_", "-");
                return (
                  <div className={`dispute-verification outcome-${outcome}`}>
                    <div className="dispute-verification-head">
                      <div>
                        <p className="card-label">ATTACHED VERIFICATION</p>
                        <span className="verdict-pill">{item.deal.verificationCheck.outcome.replaceAll("_", " ")}</span>
                      </div>
                      <Link className="verification-report-link" href={`/verification/${item.deal.verificationCheck.id}`}>
                        Full report ↗
                      </Link>
                    </div>
                    <p className="workflow-title">{report.headline}</p>
                    <p className="muted">{report.summary}</p>
                    <p className="small-muted">
                      Checked against {item.deal.verificationCheck.organization} · {report.couldNotDetermine.length} open question{report.couldNotDetermine.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                );
              })()}
              <div className="dispute-grid">
                <div>
                  <p className="card-label">AGREEMENT</p>
                  <p>{item.deal.description}</p>
                  <small>
                    Seller: {item.deal.seller.name ?? item.deal.seller.email}
                    <br />
                    Buyer: {item.deal.buyer?.name ?? item.deal.buyer?.email ?? "Unknown"}
                    <br />
                    Deposit {new Intl.NumberFormat("en-IN", { style: "currency", currency: item.deal.currency.toUpperCase() }).format(item.deal.depositCents / 100)} · Balance {new Intl.NumberFormat("en-IN", { style: "currency", currency: item.deal.currency.toUpperCase() }).format(item.deal.balanceCents / 100)}
                  </small>
                </div>
                <div>
                  <p className="card-label">EVIDENCE</p>
                  {item.deal.evidence.length === 0 && <p className="result-none">No evidence attached.</p>}
                  {item.deal.evidence.map((evidence) => (
                    <div className="evidence-row" key={evidence.id}>
                      {evidence.storageKey ? (
                        <a href={`/api/evidence/${evidence.id}/download`}>{evidence.fileName} ↗</a>
                      ) : (
                        <span>{evidence.fileName}</span>
                      )}
                      <small>
                        {evidence.aiVerdict
                          ? `Auto triage: ${evidence.aiVerdict} · ${evidence.aiConfidence}%`
                          : evidence.note ?? "Evidence preview · not stored"}
                        {evidence.sha256 ? ` · SHA-256 ${evidence.sha256.slice(0, 10)}…` : ""}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
              {item.deal.auditEvents.length > 0 && (
                <div className="admin-statements">
                  <p className="card-label">STATEMENTS FROM BOTH SIDES</p>
                  {item.deal.auditEvents.map((event) => {
                    const metadata = event.metadata as { statement?: string; role?: string } | null;
                    return (
                      <div className="admin-statement" key={event.id}>
                        <div className="dispute-statement-head">
                          <span className={`statement-role role-${(metadata?.role ?? "BUYER").toLowerCase()}`}>
                            {metadata?.role ?? "BUYER"}
                          </span>
                          <small>{event.actor?.name ?? event.actor?.email ?? "Participant"} · {new Date(event.createdAt).toLocaleDateString()}</small>
                        </div>
                        <p>{metadata?.statement ?? ""}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Decision note (minimum 10 characters)"
                rows={3}
              />
              <div className="action-row">
                <button
                  className="button-primary"
                  disabled={Boolean(pending) || note.length < 10}
                  onClick={() => resolve(item.id, "RELEASE_TO_SELLER")}
                >
                  Release to seller
                </button>
                <button
                  className="button-danger"
                  disabled={Boolean(pending) || note.length < 10}
                  onClick={() => resolve(item.id, "REFUND_TO_BUYER")}
                >
                  Refund to buyer
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
