import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPublicDeal } from "@/lib/deals";
import { ensureContract, signatureView, type ContractSnapshot } from "@/lib/contracts";
import LegalFooter from "@/components/legal-footer";
import ContractSignForm from "./contract-sign-form";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function date(value: string | null | undefined) {
  if (!value) return "Not specified";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const deal = await getPublicDeal(token);
  if (!deal) notFound();

  const [session, participant] = await Promise.all([
    auth(),
    prisma.deal.findUnique({
      where: { publicToken: token },
      select: { buyerId: true, sellerId: true },
    }),
  ]);
  const userId = session?.user?.id ?? null;
  const role =
    userId && participant?.sellerId === userId
      ? ("SELLER" as const)
      : userId && participant?.buyerId === userId
        ? ("BUYER" as const)
        : null;

  const contract = await ensureContract(deal.id);
  const snapshot = contract.snapshot as unknown as ContractSnapshot;
  const signatures = contract.signatures.map(signatureView);
  const sellerSignature = signatures.find((signature) => signature.role === "SELLER");
  const buyerSignature = signatures.find((signature) => signature.role === "BUYER");
  const mySignature = role ? signatures.find((signature) => signature.role === role) : null;

  return (
    <main className="contract-page">
      <nav className="topbar contract-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <div className="nav-links">
          <Link href={`/deal/${token}`}>Back to deal</Link>
          <a className="nav-cta" href={`/api/deals/${token}/contract/pdf`}>
            Download PDF <span>↗</span>
          </a>
        </div>
      </nav>

      <header className="contract-hero">
        <p className="eyebrow">
          <span className="eyebrow-dot" /> Deal passport · {snapshot.number}
        </p>
        <h1>
          The deal,
          <br />
          <em>in one record.</em>
        </h1>
        <p>
          The scope, milestones, verification outcome, and evidence manifest are frozen into this
          agreement. Both parties sign the same hash.
        </p>
        <div className="contract-meta-row">
          <span className={`contract-status contract-status-${contract.status.toLowerCase().replaceAll("_", "-")}`}>
            {contract.status.replaceAll("_", " ")}
          </span>
          <span>{snapshot.deal.status.replaceAll("_", " ")}</span>
          <span>SHA-256 {contract.contentHash.slice(0, 16)}…</span>
          <span>Generated {date(snapshot.generatedAt)}</span>
        </div>
      </header>

      <article className="contract-doc">
        <div className="contract-doc-head">
          <div>
            <p className="card-label">PROTECTED DEAL CONTRACT</p>
            <h2>{snapshot.deal.title}</h2>
          </div>
          <div className="contract-doc-number">
            <strong>{snapshot.number}</strong>
            <span>{money(snapshot.deal.amountCents, snapshot.deal.currency)}</span>
          </div>
        </div>

        <section className="contract-section">
          <p className="card-label">01 · PARTIES</p>
          <div className="contract-party-grid">
            <div>
              <span>Seller</span>
              <strong>{snapshot.parties.seller.legalName}</strong>
              <small>
                {snapshot.parties.seller.kycStatus.replaceAll("_", " ").toLowerCase()} · payout{" "}
                {snapshot.parties.seller.payoutBank ?? "not provided"}{" "}
                {snapshot.parties.seller.payoutLast4
                  ? `ending ${snapshot.parties.seller.payoutLast4}`
                  : ""}
              </small>
            </div>
            <div>
              <span>Buyer</span>
              <strong>{snapshot.parties.buyer?.name ?? "Buyer not yet assigned"}</strong>
              <small>{snapshot.terms.platform} protected workspace</small>
            </div>
          </div>
        </section>

        <section className="contract-section">
          <p className="card-label">02 · SCOPE & PRICE</p>
          <p className="contract-scope">{snapshot.deal.description}</p>
          <div className="contract-terms">
            <span>
              <b>Total protected</b>
              {money(snapshot.deal.amountCents, snapshot.deal.currency)}
            </span>
            <span>
              <b>Delivery deadline</b>
              {date(snapshot.deal.deliveryDeadline)}
            </span>
            <span>
              <b>Platform fee</b>
              {money(snapshot.fees.platformFeeCents, snapshot.deal.currency)} ({snapshot.fees.platformFeePercent}%)
            </span>
            <span>
              <b>Seller receives</b>
              {money(snapshot.fees.sellerNetCents, snapshot.deal.currency)}
            </span>
          </div>
        </section>

        <section className="contract-section">
          <p className="card-label">03 · MILESTONES & RELEASE</p>
          {snapshot.milestones.length === 0 ? (
            <p className="contract-scope">
              Single delivery. The protected balance releases when the buyer accepts the delivery,
              subject to the dispute process.
            </p>
          ) : (
            <div className="contract-milestones">
              {snapshot.milestones.map((milestone) => (
                <div key={milestone.position}>
                  <span className="contract-ms-number">M{milestone.position}</span>
                  <div>
                    <strong>{milestone.title}</strong>
                    <p>{milestone.description}</p>
                    {milestone.acceptanceCriteria && (
                      <small>Acceptance: {milestone.acceptanceCriteria}</small>
                    )}
                  </div>
                  <div className="contract-ms-side">
                    <strong>{money(milestone.amountCents, snapshot.deal.currency)}</strong>
                    <span>{milestone.status.replaceAll("_", " ")}</span>
                    <small>{milestone.dueAt ? `Due ${date(milestone.dueAt)}` : "No due date"}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="contract-section">
          <p className="card-label">04 · VERIFICATION & EVIDENCE</p>
          {snapshot.verification ? (
            <>
              <div className="contract-verification">
                <span className={`contract-outcome outcome-${snapshot.verification.outcome.toLowerCase().replaceAll("_", "-")}`}>
                  {snapshot.verification.outcome.replaceAll("_", " ")}
                </span>
                <div>
                  <strong>{snapshot.verification.headline}</strong>
                  <p>{snapshot.verification.summary}</p>
                </div>
              </div>
              {snapshot.verification.couldNotDetermine.length > 0 && (
                <div className="contract-open-questions">
                  <b>Open questions recorded</b>
                  <ul>
                    {snapshot.verification.couldNotDetermine.slice(0, 6).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="contract-scope">No verification report is attached to this deal.</p>
          )}
          <div className="contract-evidence">
            <b>Evidence manifest</b>
            {snapshot.evidence.length === 0 ? (
              <p className="muted">No evidence files are attached yet.</p>
            ) : (
              snapshot.evidence.map((item) => (
                <div key={`${item.fileName}-${item.createdAt}`}>
                  <span>{item.fileName}</span>
                  <small>{item.sha256 ? `SHA-256 ${item.sha256.slice(0, 20)}…` : "Hash pending"}</small>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="contract-section">
          <p className="card-label">05 · DISPUTE & CUSTODY</p>
          <p className="contract-scope">
            Either party may dispute a delivery. Both sides may submit evidence, and TrustBridge
            human review aims to resolve the dispute within {snapshot.terms.disputeWindowDays} days.
            Funds remain protected while the dispute is open.
          </p>
          <p className="contract-fine">
            TrustBridge is a technology platform, not a bank or licensed escrow. Payment processing
            and custody are provided by {snapshot.terms.paymentPartner}, subject to that partner&apos;s
            terms. Governing law: {snapshot.terms.jurisdiction}.
          </p>
        </section>

        <section className="contract-section">
          <p className="card-label">06 · SIGNATURES</p>
          <div className="contract-signatures">
            <div>
              <span>Seller</span>
              <strong>{sellerSignature ? sellerSignature.name : "Awaiting signature"}</strong>
              {sellerSignature ? (
                <>
                  <em>&ldquo;{sellerSignature.signatureText}&rdquo;</em>
                  <small>Signed {date(sellerSignature.signedAt)}</small>
                </>
              ) : (
                <small>Not yet signed</small>
              )}
            </div>
            <div>
              <span>Buyer</span>
              <strong>{buyerSignature ? buyerSignature.name : "Awaiting signature"}</strong>
              {buyerSignature ? (
                <>
                  <em>&ldquo;{buyerSignature.signatureText}&rdquo;</em>
                  <small>Signed {date(buyerSignature.signedAt)}</small>
                </>
              ) : (
                <small>Not yet signed</small>
              )}
            </div>
          </div>
          <p className="contract-hash">
            Content hash <code>{contract.contentHash}</code>
          </p>
        </section>
      </article>

      {role && !mySignature ? (
        <ContractSignForm
          token={token}
          role={role}
          defaultName={
            role === "SELLER"
              ? snapshot.parties.seller.legalName
              : snapshot.parties.buyer?.name ?? ""
          }
        />
      ) : role && mySignature ? (
        <p className="contract-signed-note">
          You signed as {role.toLowerCase()} on {date(mySignature.signedAt)}.{" "}
          {signatures.length < 2
            ? "Waiting for the other party."
            : "This contract is fully executed."}
        </p>
      ) : (
        <p className="contract-signed-note">
          <Link href={`/signin?next=/deal/${token}/contract`}>Sign in</Link> as the buyer or seller
          to add your signature.
        </p>
      )}

      <LegalFooter />
    </main>
  );
}
