"use client";

import { useMemo, useState } from "react";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(cents / 100);
}

export default function NoticeDraft({
  token,
  title,
  description,
  amountCents,
  currency,
  sellerName,
  buyerName,
  buyerEmail,
  reason,
  responseBy,
}: {
  token: string;
  title: string;
  description: string;
  amountCents: number;
  currency: string;
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
  reason: string;
  responseBy: string;
}) {
  const [copied, setCopied] = useState(false);

  const notice = useMemo(
    () => `LEGAL NOTICE — DRAFT

Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
To: ${sellerName}
From: ${buyerName}${buyerEmail ? ` (${buyerEmail})` : ""}
Re: ${title} — Deal #${token.slice(-8).toUpperCase()}
Protected amount: ${money(amountCents, currency)}

1. AGREEMENT
${description}

2. BREACH
${reason}

3. DEMAND
Please cure the breach or respond in writing by ${responseBy}. The protected amount remains subject to the TrustBridge Refund & Dispute Policy and any human review.

4. RECORD
The agreement, evidence, statements, and verification report are recorded against the deal reference above.

This is a draft generated from the deal record. It is not legal advice. Have a lawyer review it before sending.`,
    [amountCents, buyerEmail, buyerName, currency, description, reason, responseBy, sellerName, title, token],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(notice);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([notice], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trustbridge-notice-${token.slice(-8)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="notice-draft">
      <summary>Draft legal notice <span>↗</span></summary>
      <p className="notice-warning">Template generated from the deal record. Not legal advice; have counsel review before sending.</p>
      <pre>{notice}</pre>
      <div className="notice-actions">
        <button type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy notice"}</button>
        <button type="button" onClick={download}>Download .txt</button>
      </div>
    </details>
  );
}
