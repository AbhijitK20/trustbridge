"use client";

import { useState } from "react";
import Link from "next/link";

export default function PayButton({
  token,
  disabled,
  demoMode = false,
  sellerName,
  termsVersion,
}: {
  token: string;
  disabled: boolean;
  demoMode?: boolean;
  sellerName: string;
  termsVersion: string;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function checkout() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/deals/${token}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerEmail: email, consent: true }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Checkout could not be started.");
      setPending(false);
      return;
    }
    if (body.url) window.location.assign(body.url);
    else if (body.demo) window.location.reload();
  }

  return (
    <div className="pay-area">
      <label>
        Your email for the receipt
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <label className="consent-check">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>
          I agree to the <Link href="/legal/terms" target="_blank">Terms</Link> and{" "}
          <Link href="/legal/refunds" target="_blank">Refund & Dispute Policy</Link>. I understand I am paying{" "}
          <strong>{sellerName}</strong>, not TrustBridge.
        </span>
      </label>
      <button
        className="button-primary form-submit"
        onClick={checkout}
        disabled={disabled || pending || !email || !consent}
      >
        {pending
          ? demoMode
            ? "Holding payment…"
            : "Opening secure checkout…"
          : disabled
            ? "Payment unavailable"
            : demoMode
              ? "Hold payment (demo) ↗"
              : "Pay securely with Stripe ↗"}
      </button>
      <p className="form-hint">
        Terms version {termsVersion}. {demoMode ? "Demo ledger: no card is charged and no real money moves." : "Payment is processed by the licensed payment partner shown above."}
      </p>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
