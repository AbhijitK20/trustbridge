import Link from "next/link";
import MilestonePanel, { type MilestoneView } from "./milestone-panel";

export default function DealExtras({
  token,
  currency,
  milestones,
  isBuyer,
  isSeller,
  verificationOutcome,
  demoMode,
  contract,
}: {
  token: string;
  currency: string;
  milestones: MilestoneView[];
  isBuyer: boolean;
  isSeller: boolean;
  verificationOutcome: string | null;
  demoMode: boolean;
  contract: { number: string; status: string; contentHash: string } | null;
}) {
  return (
    <div className="deal-extras">
      {milestones.length > 0 && (
        <MilestonePanel
          token={token}
          currency={currency}
          milestones={milestones}
          isBuyer={isBuyer}
          isSeller={isSeller}
          verificationOutcome={verificationOutcome}
          demoMode={demoMode}
        />
      )}

      <section className="contract-callout">
        <div>
          <p className="card-label">DEAL PASSPORT</p>
          <h3>One agreement. Every claim attached.</h3>
          <p>
            The contract snapshots the scope, milestones, verification outcome, and evidence
            manifest. Both parties sign the same record.
          </p>
          <div className="contract-callout-meta">
            <span>{contract ? contract.number : "Draft on open"}</span>
            <span>{contract ? contract.status.replaceAll("_", " ").toLowerCase() : "awaiting signatures"}</span>
            {contract?.contentHash && <span>SHA-256 {contract.contentHash.slice(0, 12)}…</span>}
          </div>
        </div>
        <div className="contract-callout-actions">
          <Link className="button-primary" href={`/deal/${token}/contract`}>
            Open contract <span>↗</span>
          </Link>
          <a className="text-link" href={`/api/deals/${token}/contract/pdf`}>
            Download PDF
          </a>
        </div>
      </section>
    </div>
  );
}
