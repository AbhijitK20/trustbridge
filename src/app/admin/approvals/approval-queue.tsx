"use client";

import { useState } from "react";
import Link from "next/link";

type Approval = {
  id: string;
  action: "DISPUTE_REFUND" | "DISPUTE_RELEASE" | "DELIVERY_ACCEPT" | "DELIVERY_REFUND";
  amountCents: number;
  note: string;
  createdAt: Date;
  requestedById: string;
  requestedBy: { id: string; name: string | null; email: string };
  deal: { title: string; publicToken: string; priceCents: number; currency: string; status: string };
  dispute: { id: string; reason: string } | null;
};

const LABELS: Record<Approval["action"], string> = {
  DISPUTE_REFUND: "Refund buyer",
  DISPUTE_RELEASE: "Release to seller",
  DELIVERY_ACCEPT: "Accept delivery and release balance",
  DELIVERY_REFUND: "Refund buyer for delivery",
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
}

export default function ApprovalQueue({
  approvals: initial,
  viewerId,
  demoMode,
}: {
  approvals: Approval[];
  viewerId: string;
  demoMode: boolean;
}) {
  const [approvals, setApprovals] = useState(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function act(id: string, decision: "APPROVE" | "REJECT") {
    setPending(id);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/approvals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: notes[id] ?? "" }),
    });
    const body = (await response.json()) as { error?: string; message?: string; approvalStatus?: string };
    if (!response.ok && !body.approvalStatus) {
      setError(body.error ?? "The approval action failed.");
      setPending("");
      return;
    }
    setApprovals((items) => items.filter((item) => item.id !== id));
    setNotice(body.message ?? (decision === "APPROVE" ? "Decision executed." : "Request rejected."));
    setPending("");
  }

  if (approvals.length === 0) {
    return (
      <section className="empty-state">
        <h2>No second approvals waiting.</h2>
        <p>High-value refunds and releases requested by another admin will appear here.</p>
      </section>
    );
  }

  return (
    <section className="approval-list">
      {demoMode && <p className="demo-banner">Demo ledger: second approval updates this workspace only.</p>}
      {notice && <p className="form-success admin-notice">{notice}</p>}
      {error && <p className="form-error admin-notice">{error}</p>}
      {approvals.map((approval) => {
        const isMaker = approval.requestedById === viewerId;
        return (
          <article className="approval-card" key={approval.id}>
            <div className="approval-head">
              <div>
                <p className="card-label">SECOND APPROVAL · {approval.deal.status}</p>
                <h2>{LABELS[approval.action]}</h2>
                <p className="small-muted">
                  <Link href={`/deal/${approval.deal.publicToken}`}>{approval.deal.title} ↗</Link>
                  {" · "}
                  {money(approval.amountCents, approval.deal.currency)}
                </p>
              </div>
              <span className="approval-pill">Pending</span>
            </div>

            <div className="approval-grid">
              <div>
                <p className="card-label">REQUESTED BY</p>
                <p>{approval.requestedBy.name ?? approval.requestedBy.email}</p>
                <small>{new Date(approval.createdAt).toLocaleString("en-IN")}</small>
              </div>
              <div>
                <p className="card-label">MAKER NOTE</p>
                <p>{approval.note}</p>
              </div>
            </div>

            {approval.dispute && (
              <div className="approval-dispute">
                <p className="card-label">DISPUTE</p>
                <p>“{approval.dispute.reason}”</p>
              </div>
            )}

            {isMaker ? (
              <p className="form-hint">You requested this decision. A different admin must approve or reject it.</p>
            ) : (
              <>
                <textarea
                  value={notes[approval.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [approval.id]: event.target.value }))}
                  placeholder="Reviewer note (optional)"
                  rows={2}
                />
                <div className="approval-actions">
                  <button className="button-primary" onClick={() => act(approval.id, "APPROVE")} disabled={pending === approval.id}>
                    Approve & execute
                  </button>
                  <button className="button-danger" onClick={() => act(approval.id, "REJECT")} disabled={pending === approval.id}>
                    Reject request
                  </button>
                </div>
              </>
            )}
          </article>
        );
      })}
    </section>
  );
}
