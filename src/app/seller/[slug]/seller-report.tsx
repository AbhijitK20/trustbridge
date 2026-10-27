"use client";

import { useState } from "react";

export default function SellerReport({ slug }: { slug: string }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit() {
    const response = await fetch(`/api/sellers/${slug}/reports`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Report could not be submitted."); else { setMessage("Report submitted for human review."); setReason(""); }
  }
  return <div className="report-box"><p className="workflow-title">Report a concern</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us what happened. Reports are reviewed by TrustBridge." rows={3} /><button className="button-danger" onClick={submit} disabled={reason.length < 20}>Submit report</button>{message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}</div>;
}
