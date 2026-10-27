"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export default function VerifySellerForm({
  defaultEmail,
  defaultDomain,
  defaultLegalName,
  alreadyVerified,
  method,
  kycProvider,
}: {
  defaultEmail: string;
  defaultDomain: string;
  defaultLegalName: string;
  alreadyVerified: boolean;
  method: string | null;
  kycProvider: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [domain, setDomain] = useState(defaultDomain || defaultEmail.split("@")[1] || "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [otpPending, setOtpPending] = useState(false);
  const [legalName, setLegalName] = useState(defaultLegalName);
  const [entityType, setEntityType] = useState("INDIVIDUAL");
  const [taxIdLast4, setTaxIdLast4] = useState("");
  const [identityChecked, setIdentityChecked] = useState(false);
  const [payoutAccountName, setPayoutAccountName] = useState(defaultLegalName);
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountLast4, setPayoutAccountLast4] = useState("");
  const [payoutChecked, setPayoutChecked] = useState(false);
  const [digilocker, setDigilocker] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const namesMatch = Boolean(legalName && payoutAccountName && normalizeName(legalName) === normalizeName(payoutAccountName));

  function updateEmail(value: string) {
    setEmail(value);
    setOtpVerified(false);
    if (!domain && value.includes("@")) setDomain(value.split("@")[1]);
  }

  async function sendOtp() {
    setError("");
    setMessage("");
    if (!email.includes("@") || !domain.includes(".")) {
      setError("Add a work email and domain first, e.g. you@studio.com and studio.com.");
      return;
    }
    setOtpPending(true);
    try {
      const response = await fetch("/api/sellers/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domain }),
      });
      const body = (await response.json()) as { error?: string; demoOtp?: string };
      if (!response.ok) {
        setError(body.error ?? "The code could not be sent.");
        return;
      }
      setOtpSent(true);
      setDemoOtp(body.demoOtp ?? "");
      setMessage(body.demoOtp ? `Demo OTP: ${body.demoOtp}.` : "OTP sent to your work email.");
    } catch {
      setError("Could not reach the verification service.");
    } finally {
      setOtpPending(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setMessage("");
    setOtpPending(true);
    try {
      const response = await fetch("/api/sellers/otp/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const body = (await response.json()) as { error?: string; verified?: boolean };
      if (!response.ok || !body.verified) {
        setError(body.error ?? "The code is incorrect.");
        return;
      }
      setOtpVerified(true);
      setMessage("Email and domain confirmed.");
    } catch {
      setError("Could not reach the verification service.");
    } finally {
      setOtpPending(false);
    }
  }

  function runMockKyc() {
    setError("");
    if (legalName.trim().length < 2) {
      setError("Enter the legal seller name first.");
      return;
    }
    if (!/^[A-Za-z0-9]{4}$/.test(taxIdLast4.trim())) {
      setError("Enter the last four characters of the tax ID.");
      return;
    }
    setIdentityChecked(true);
    setMessage(`Mock KYC complete. No document was uploaded; production uses ${kycProvider}.`);
  }

  function checkPayout() {
    setError("");
    if (payoutAccountName.trim().length < 2 || payoutBankName.trim().length < 2 || !/^\d{4}$/.test(payoutAccountLast4)) {
      setError("Enter the account holder name, bank, and last four digits.");
      return;
    }
    setPayoutChecked(true);
    setMessage(
      namesMatch
        ? "Payout ownership matches the legal name."
        : "Payout name does not match the legal name. This will go to compliance review, not verified.",
    );
  }

  async function finish() {
    if (!otpVerified) {
      setError("Verify the email OTP before finishing.");
      return;
    }
    if (!identityChecked) {
      setError("Run the KYC check before finishing.");
      return;
    }
    if (!payoutChecked) {
      setError("Check payout ownership before finishing.");
      return;
    }
    if (!consent) {
      setError("Agree to the seller agreement and terms before finishing.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/sellers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          domain,
          legalName,
          entityType,
          taxIdLast4,
          payoutAccountName,
          payoutBankName,
          payoutAccountLast4,
          digilocker,
          otp,
          consent: true,
        }),
      });
      const body = (await response.json()) as { error?: string; slug?: string; kycStatus?: string };
      if (!response.ok || !body.slug) {
        setError(body.error ?? "Verification could not be saved.");
        return;
      }
      router.push(`/seller/${body.slug}?${body.kycStatus === "VERIFIED" ? "verified=1" : "kyc=pending"}`);
    } catch {
      setError("Could not reach the verification service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="deal-form verify-form">
      {alreadyVerified && (
        <div className="verify-success">
          <strong>This profile is already verified.</strong>
          <p>
            Method: {method === "DIGILOCKER" ? "mock DigiLocker + KYC" : "work email + KYC"}.
            You can re-run the check below.
          </p>
        </div>
      )}

      <div className="verify-steps">
        <section className="verify-step">
          <p className="eyebrow">Step 01 · Work email</p>
          <h2>Match the email to the domain.</h2>
          <div className="form-two">
            <label htmlFor="verify-email">
              Work email
              <input id="verify-email" type="email" value={email} onChange={(event) => updateEmail(event.target.value)} placeholder="you@studio.com" />
            </label>
            <label htmlFor="verify-domain">
              Domain
              <input id="verify-domain" value={domain} onChange={(event) => { setDomain(event.target.value); setOtpVerified(false); }} placeholder="studio.com" />
            </label>
          </div>
          <div className="verify-row">
            <button type="button" className="button-light" onClick={sendOtp} disabled={otpPending}>Send OTP</button>
            {otpSent && (
              <>
                <input className="verify-otp" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="123456" inputMode="numeric" aria-label="Verification code" />
                <button type="button" className="button-primary" onClick={verifyOtp} disabled={otpVerified || otpPending}>
                  {otpVerified ? "Verified ✓" : "Verify OTP"}
                </button>
              </>
            )}
          </div>
          <p className="form-hint">
            Demo mode shows the code here; production sends it to the work email. The code expires in 10 minutes.
            {demoOtp ? ` Demo OTP: ${demoOtp}.` : ""}
          </p>
        </section>

        <section className="verify-step">
          <p className="eyebrow">Step 02 · Legal identity</p>
          <h2>Who is the legal seller?</h2>
          <div className="form-two">
            <label htmlFor="legal-name">
              Legal name / registered entity
              <input id="legal-name" value={legalName} onChange={(event) => { setLegalName(event.target.value); setIdentityChecked(false); }} placeholder="Meera Nair or Meera Studio LLP" />
            </label>
            <label htmlFor="entity-type">
              Entity type
              <select id="entity-type" value={entityType} onChange={(event) => { setEntityType(event.target.value); setIdentityChecked(false); }}>
                <option value="INDIVIDUAL">Individual</option>
                <option value="SOLE_PROPRIETOR">Sole proprietor</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="LLP">LLP</option>
                <option value="COMPANY">Company</option>
              </select>
            </label>
          </div>
          <label htmlFor="tax-id">
            Tax ID — last 4 characters
            <input id="tax-id" value={taxIdLast4} maxLength={4} onChange={(event) => { setTaxIdLast4(event.target.value); setIdentityChecked(false); }} placeholder="1234" />
          </label>
          <div className="verify-row">
            <button type="button" className="button-light" onClick={runMockKyc} disabled={identityChecked}>
              {identityChecked ? "Mock KYC complete ✓" : "Run mock KYC check"}
            </button>
          </div>
          <p className="form-hint">
            Production sends the ID document and liveness check to a KYC provider. TrustBridge stores only the result and the last four characters.
          </p>
        </section>

        <section className="verify-step">
          <p className="eyebrow">Step 03 · Payout ownership</p>
          <h2>Where does the money go?</h2>
          <div className="form-two">
            <label htmlFor="payout-name">
              Account holder name
              <input id="payout-name" value={payoutAccountName} onChange={(event) => { setPayoutAccountName(event.target.value); setPayoutChecked(false); }} placeholder="Meera Nair" />
            </label>
            <label htmlFor="payout-bank">
              Bank
              <input id="payout-bank" value={payoutBankName} onChange={(event) => { setPayoutBankName(event.target.value); setPayoutChecked(false); }} placeholder="HDFC Bank" />
            </label>
          </div>
          <label htmlFor="payout-last4">
            Account number — last 4 digits
            <input id="payout-last4" value={payoutAccountLast4} maxLength={4} inputMode="numeric" onChange={(event) => { setPayoutAccountLast4(event.target.value); setPayoutChecked(false); }} placeholder="4321" />
          </label>
          <div className="verify-row">
            <button type="button" className="button-light" onClick={checkPayout}>
              {payoutChecked ? "Payout checked ✓" : "Check payout ownership"}
            </button>
            {payoutChecked && <span className={namesMatch ? "name-state name-match" : "name-state name-mismatch"}>{namesMatch ? "Name matches" : "Name mismatch · review"}</span>}
          </div>
          <p className="form-hint">
            Production uses a penny-drop or partner verification. Full account numbers stay with the payment partner, not TrustBridge.
          </p>
        </section>

        <section className="verify-step">
          <p className="eyebrow">Step 04 · Mock DigiLocker</p>
          <h2>Add a second identity signal.</h2>
          <p className="verify-copy">
            In production this would be an authorised DigiLocker consent flow. Here it is simulated — no documents are requested or stored.
          </p>
          <button type="button" className={digilocker ? "button-primary verify-connected" : "button-light"} onClick={() => setDigilocker((value) => !value)}>
            {digilocker ? "Mock DigiLocker connected ✓" : "Connect mock DigiLocker"}
          </button>
        </section>

        <section className="verify-step verify-finish">
          <p className="eyebrow">Step 05 · Consent & publish</p>
          <h2>Make the profile verifiable.</h2>
          <p className="verify-copy">
            A verified badge means the legal name, payout ownership, and sanctions check passed. It is not a guarantee of delivery — the protected deal still does the work.
          </p>
          <label className="consent-check">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>
              I agree to the <Link href="/legal/seller-agreement" target="_blank">Seller Agreement</Link>,{" "}
              <Link href="/legal/terms" target="_blank">Terms</Link>,{" "}
              <Link href="/legal/privacy" target="_blank">Privacy Policy</Link>, and electronic records. I confirm I am authorised to act for this seller and authorise payouts to the account above.
            </span>
          </label>
          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="button-primary form-submit" type="button" onClick={finish} disabled={pending || !otpVerified || !identityChecked || !payoutChecked || !consent}>
            {pending ? "Saving verification…" : "Finish verification ↗"}
          </button>
        </section>
      </div>
    </div>
  );
}
