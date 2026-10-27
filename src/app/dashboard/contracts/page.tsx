import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(cents / 100);
}

function date(value: Date | null) {
  if (!value) return "Not signed";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardContractsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/contracts");

  const deals = await prisma.deal.findMany({
    where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      contract: { include: { signatures: { orderBy: { signedAt: "asc" } } } },
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
    },
  });

  const signed = deals.filter((deal) => deal.contract?.status === "SIGNED").length;
  const awaiting = deals.filter((deal) => deal.contract && deal.contract.status !== "SIGNED").length;
  const unsigned = deals.length - signed - awaiting;
  const signedValue = deals
    .filter((deal) => deal.contract?.status === "SIGNED")
    .reduce((sum, deal) => sum + deal.priceCents, 0);

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Workspace · contracts</p>
          <h1>
            The deal, <em>in one record.</em>
          </h1>
          <p>
            Every contract snapshots the scope, price, fee, milestones, verification outcome, and
            signatures. The hash is the record.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn ws-btn-ghost" href="/legal/terms">
            Terms <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-kpis">
        <div className="ws-kpi ws-kpi-dark">
          <span className="ws-kpi-label">Fully signed</span>
          <span className="ws-kpi-value">{signed}</span>
          <span className="ws-kpi-note">Buyer and seller signatures on record</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Awaiting signature</span>
          <span className="ws-kpi-value">{awaiting}</span>
          <span className="ws-kpi-note">Partly signed or waiting for both parties</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Not opened</span>
          <span className="ws-kpi-value">{unsigned}</span>
          <span className="ws-kpi-note">The contract is created when you open it</span>
        </div>
        <div className="ws-kpi">
          <span className="ws-kpi-label">Signed value</span>
          <span className="ws-kpi-value">{money(signedValue)}</span>
          <span className="ws-kpi-note">Deal value covered by a signed record</span>
        </div>
      </section>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Signature record</small>
            <h2>Your contracts</h2>
          </div>
          <Link href="/legal/terms">Terms</Link>
        </div>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Contract</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Signatures</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <span className="ws-empty" style={{ display: "block" }}>
                      No deals yet. A contract is created from a deal.
                    </span>
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <Link className="ws-cell-title" href={`/deal/${deal.publicToken}`}>
                        {deal.title}
                      </Link>
                      <span className="ws-cell-sub">
                        #{deal.publicToken.slice(-6).toUpperCase()}
                        {deal.contract?.signedAt ? ` · signed ${date(deal.contract.signedAt)}` : ""}
                      </span>
                    </td>
                    <td>
                      <span className="ws-cell-title" style={{ fontSize: 11.5, fontWeight: 400 }}>
                        {deal.contract?.number ?? "Draft on open"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`ws-status ws-status-${
                          deal.contract?.status === "SIGNED"
                            ? "released"
                            : deal.contract
                              ? "awaiting_payment"
                              : "draft"
                        }`}
                      >
                        <i />{" "}
                        {deal.contract
                          ? deal.contract.status.replaceAll("_", " ").toLowerCase()
                          : "not created"}
                      </span>
                    </td>
                    <td className="ws-cell-money">{money(deal.priceCents)}</td>
                    <td>
                      <span className="ws-cell-sub" style={{ marginTop: 0 }}>
                        {deal.contract && deal.contract.signatures.length > 0
                          ? deal.contract.signatures
                              .map((signature) => `${signature.role.toLowerCase()}: ${signature.name}`)
                              .join(" · ")
                          : "—"}
                      </span>
                    </td>
                    <td className="ws-cell-right">
                      <Link className="ws-row-arrow" href={`/deal/${deal.publicToken}/contract`} aria-label="Open contract">
                        {deal.contract ? "↗" : "+"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Integrity</small>
            <h2>What freezing means</h2>
          </div>
          <Link href="/dashboard/checks">Evidence</Link>
        </div>
        <div className="ws-panel-body">
          <p className="ws-split-note">
            The contract is frozen when signed. Later payment, credit, or payout activity is recorded
            against it; editing a signed contract requires a new version. The contract hash and the
            audit trail are the record if a dispute is opened.
          </p>
          <hr className="ws-divider" />
          <div className="ws-fact">
            <span>Snapshot includes</span>
            <strong>Scope · price · fee · milestones · verification</strong>
          </div>
          <div className="ws-fact">
            <span>Edit policy</span>
            <strong>A signed contract needs a new version</strong>
          </div>
        </div>
      </section>
    </>
  );
}
