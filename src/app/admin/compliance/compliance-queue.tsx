"use client";

import { useState } from "react";

type Seller = {
  id: string;
  slug: string;
  isVerified: boolean;
  user: { name: string | null; email: string };
  kyc: {
    legalName: string | null;
    entityType: string | null;
    taxIdLast4: string | null;
    kycStatus: string;
    sanctionsStatus: string;
    payoutAccountName: string | null;
    payoutBankName: string | null;
    payoutAccountLast4: string | null;
    updatedAt: Date;
  } | null;
};

export default function ComplianceQueue({ sellers: initial, demoMode }: { sellers: Seller[]; demoMode: boolean }) {
  const [sellers, setSellers] = useState(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function act(id: string, action: "APPROVE" | "REJECT") {
    const note = notes[id] ?? "";
    if (action === "REJECT" && note.length < 10) {
      setError("Add a rejection note of at least 10 characters.");
      return;
    }
    setPending(id);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/compliance/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const body = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setError(body.error ?? "The compliance action failed.");
      setPending("");
      return;
    }
    setSellers((items) => items.filter((item) => item.id !== id));
    setNotice(body.message ?? "Decision recorded.");
    setPending("");
  }

  if (sellers.length === 0) {
    return (
      <section className="empty-state">
        <h2>No KYC review waiting.</h2>
        <p>New sellers with a payout-name mismatch or sanctions flag will appear here.</p>
      </section>
    );
  }

  return (
    <section className="compliance-list">
      {demoMode && <p className="demo-banner">Demo KYC: no real identity documents, bank details, or sanctions calls are used.</p>}
      {notice && <p className="form-success admin-notice">{notice}</p>}
      {error && <p className="form-error admin-notice">{error}</p>}
      {sellers.map((seller) => (
        <article className="compliance-card" key={seller.id}>
          <div className="compliance-head">
            <div>
              <p className="card-label">SELLER · {seller.slug}</p>
              <h2>{seller.user.name ?? seller.user.email}</h2>
              <p className="small-muted">{seller.user.email}</p>
            </div>
            <div className="compliance-status">
              <span>{seller.kyc?.kycStatus ?? "NOT_STARTED"}</span>
              <span className={`sanctions-${(seller.kyc?.sanctionsStatus ?? "NOT_SCREENED").toLowerCase()}`}>{seller.kyc?.sanctionsStatus ?? "NOT_SCREENED"}</span>
            </div>
          </div>

          <div className="compliance-grid">
            <div>
              <p className="card-label">LEGAL IDENTITY</p>
              <p>{seller.kyc?.legalName ?? "Missing"}</p>
              <small>{seller.kyc?.entityType ?? "No entity type"} · Tax ID ending {seller.kyc?.taxIdLast4 ?? "—"}</small>
            </div>
            <div>
              <p className="card-label">PAYOUT OWNERSHIP</p>
              <p>{seller.kyc?.payoutAccountName ?? "Missing"}</p>
              <small>{seller.kyc?.payoutBankName ?? "No bank"} · account ending {seller.kyc?.payoutAccountLast4 ?? "—"}</small>
            </div>
          </div>

          <textarea
            value={notes[seller.id] ?? ""}
            onChange={(event) => setNotes((current) => ({ ...current, [seller.id]: event.target.value }))}
            placeholder="Decision note (required for rejection, minimum 10 characters)"
            rows={3}
          />
          <div className="delivery-actions">
            <button className="button-primary" onClick={() => act(seller.id, "APPROVE")} disabled={pending === seller.id}>
              Approve KYC
            </button>
            <button className="button-danger" onClick={() => act(seller.id, "REJECT")} disabled={pending === seller.id || (notes[seller.id] ?? "").length < 10}>
              Reject / request fixes
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
