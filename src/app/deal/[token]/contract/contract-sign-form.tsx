"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContractSignForm({
  token,
  role,
  defaultName,
}: {
  token: string;
  role: "BUYER" | "SELLER";
  defaultName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [signature, setSignature] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/deals/${token}/contract/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, signatureText: signature, consent: true }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error ?? "The signature could not be recorded.");
        return;
      }
      setNotice(data.message ?? "Signature recorded.");
      setSignature("");
      setConsent(false);
      router.refresh();
    } catch {
      setError("Could not reach the signature service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="contract-sign-form" onSubmit={submit}>
      <div>
        <p className="card-label">SIGN AS {role}</p>
        <h3>Make it yours.</h3>
        <p>
          Type your name exactly as you want it recorded. This is a typed electronic acknowledgment, not a qualified e-signature.
        </p>
      </div>
      <div className="contract-sign-fields">
        <label htmlFor={`sign-name-${role}`}>
          Legal name
          <input
            id={`sign-name-${role}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label htmlFor={`sign-text-${role}`}>
          Signature
          <input
            id={`sign-text-${role}`}
            value={signature}
            onChange={(event) => setSignature(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            placeholder={defaultName}
            className="signature-input"
          />
        </label>
        <label className="consent-check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>
            I have read the agreement, verification report, and evidence manifest, and I agree to
            sign electronically.
          </span>
        </label>
        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-success">{notice}</p>}
        <button
          className="button-primary form-submit"
          disabled={pending || !consent || name.trim().length < 2 || signature.trim().length < 2}
          type="submit"
        >
          {pending ? "Recording signature…" : `Sign as ${role.toLowerCase()} ↗`}
        </button>
      </div>
    </form>
  );
}
