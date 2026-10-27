import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { releasedForDeal, sellerCreditSummary } from "@/lib/credits";
import { requestPayout } from "../actions";

function money(cents: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function DashboardCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/credits");
  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      sellerProfile: {
        include: {
          kyc: true,
          deals: { include: { milestones: true } },
          payoutRequests: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!user) redirect("/signin");

  const seller = user.sellerProfile;
  const summary = seller ? sellerCreditSummary(seller.deals, seller.payoutRequests) : null;
  const sellerReleased = seller?.deals.reduce((sum, deal) => sum + releasedForDeal(deal), 0) ?? 0;

  const buyerDeals = await prisma.deal.findMany({
    where: { buyerId: user.id, status: { notIn: ["DRAFT", "AWAITING_PAYMENT"] } },
    include: { milestones: true },
    orderBy: { updatedAt: "desc" },
  });
  const buyerProtected = buyerDeals
    .filter((deal) => !["RELEASED", "REFUNDED", "EXPIRED"].includes(deal.status))
    .reduce((sum, deal) => sum + deal.priceCents, 0);
  const buyerFees = buyerDeals.reduce((sum, deal) => sum + Math.round(deal.priceCents * 0.03), 0);

  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Money · credits & payouts</p>
          <h1>
            Earn here. <em>Withdraw later.</em>
          </h1>
          <p>
            Buyer payments become seller credits. Released credits can be requested for payout to the
            verified bank account. Test mode only.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn ws-btn-ghost" href="/dashboard/payments">
            Payments <i>↗</i>
          </Link>
        </div>
      </header>

      {params.saved && <div className="ws-banner ws-banner-ok">Payout request created. It is waiting for review.</div>}
      {params.error === "amount" && (
        <div className="ws-banner ws-banner-error">Enter an amount between ₹100 and your available balance.</div>
      )}
      {params.error === "seller" && (
        <div className="ws-banner ws-banner-error">Complete seller verification before requesting a payout.</div>
      )}

      {seller && summary ? (
        <>
          <section className="ws-kpis">
            <div className="ws-kpi ws-kpi-dark">
              <span className="ws-kpi-label">Available credits</span>
              <span className="ws-kpi-value">{money(summary.available)}</span>
              <span className="ws-kpi-note">Released earnings, minus pending and paid payouts</span>
            </div>
            <div className="ws-kpi">
              <span className="ws-kpi-label">Released to you</span>
              <span className="ws-kpi-value">{money(sellerReleased)}</span>
              <span className="ws-kpi-note">All-time seller credits from released milestones</span>
            </div>
            <div className="ws-kpi">
              <span className="ws-kpi-label">Pending / paid out</span>
              <span className="ws-kpi-value">{money(summary.pending + summary.paid)}</span>
              <span className="ws-kpi-note">
                {money(summary.pending)} requested · {money(summary.paid)} marked paid
              </span>
            </div>
            <div className="ws-kpi">
              <span className="ws-kpi-label">Payout account</span>
              <span className="ws-kpi-value" style={{ fontSize: 20 }}>
                {seller.kyc?.payoutBankName ?? "Not linked"}
              </span>
              <span className="ws-kpi-note">
                {seller.kyc?.payoutAccountLast4
                  ? `Ending ${seller.kyc.payoutAccountLast4}`
                  : "Complete payout verification"}
              </span>
            </div>
          </section>

          <div className="ws-grid-2">
            <section className="ws-panel">
              <div className="ws-panel-head">
                <div>
                  <small>Withdraw</small>
                  <h2>Move credits to your bank</h2>
                </div>
                <span className="ws-row-note">Bank ending {seller.kyc?.payoutAccountLast4 ?? "—"}</span>
              </div>
              <div className="ws-panel-body">
                <p className="ws-note" style={{ marginBottom: 16 }}>
                  Test-mode payout request. No real bank transfer occurs until a licensed payout
                  partner is connected.
                </p>
                <form action={requestPayout} className="ws-form">
                  <div className="ws-form-row">
                    <label htmlFor="amount">Amount in INR</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="100"
                      step="1"
                      max={Math.floor(summary.available / 100)}
                      placeholder="1000"
                      required
                    />
                    <small>Minimum ₹100. Maximum available {money(summary.available)}.</small>
                  </div>
                  <div className="ws-form-foot">
                    <button className="ws-btn" type="submit" disabled={summary.available < 10000}>
                      Request payout
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <aside className="ws-panel">
              <div className="ws-panel-head">
                <div>
                  <small>Payout account</small>
                  <h2>{seller.kyc?.payoutBankName ?? "Not linked"}</h2>
                </div>
              </div>
              <div className="ws-panel-body">
                <div className="ws-fact">
                  <span>Account name</span>
                  <strong>{seller.kyc?.payoutAccountName ?? "Not provided"}</strong>
                </div>
                <div className="ws-fact">
                  <span>Account</span>
                  <strong>Ending {seller.kyc?.payoutAccountLast4 ?? "—"}</strong>
                </div>
                <div className="ws-fact">
                  <span>Sanctions</span>
                  <strong>{seller.kyc?.sanctionsStatus?.replaceAll("_", " ").toLowerCase() ?? "Pending"}</strong>
                </div>
                <hr className="ws-divider" />
                <Link className="ws-btn ws-btn-ghost" href="/seller/verify">
                  Manage payout details <i>↗</i>
                </Link>
              </div>
            </aside>
          </div>

          <section className="ws-panel" style={{ marginTop: 12 }}>
            <div className="ws-panel-head">
              <div>
                <small>Seller ledger</small>
                <h2>Released credits</h2>
              </div>
              <Link href="/dashboard/deals">All deals</Link>
            </div>
            <div className="ws-table-wrap">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Status</th>
                    <th>Seller price</th>
                    <th>Released</th>
                    <th aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {seller.deals.filter((deal) => releasedForDeal(deal) > 0).length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <span className="ws-empty" style={{ display: "block" }}>
                          No released credits yet.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    seller.deals
                      .filter((deal) => releasedForDeal(deal) > 0)
                      .map((deal) => (
                        <tr key={deal.id}>
                          <td>
                            <Link className="ws-cell-title" href={`/deal/${deal.publicToken}`}>
                              {deal.title}
                            </Link>
                          </td>
                          <td>
                            <span className={`ws-status ws-status-${deal.status.toLowerCase()}`}>
                              <i /> {deal.status.replaceAll("_", " ").toLowerCase()}
                            </span>
                          </td>
                          <td className="ws-cell-money">{money(deal.priceCents)}</td>
                          <td className="ws-cell-money">+ {money(releasedForDeal(deal))}</td>
                          <td className="ws-cell-right">
                            <Link className="ws-row-arrow" href={`/deal/${deal.publicToken}`} aria-label="Open deal">
                              ↗
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
                <small>Payout history</small>
                <h2>Requests</h2>
              </div>
            </div>
            <div className="ws-table-wrap">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {seller.payoutRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <span className="ws-empty" style={{ display: "block" }}>
                          No payout requests yet.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    seller.payoutRequests.map((payout) => (
                      <tr key={payout.id}>
                        <td className="ws-cell-money">{money(payout.amountCents)}</td>
                        <td className="ws-cell-sub" style={{ marginTop: 0 }}>
                          {new Date(payout.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="ws-cell-sub" style={{ marginTop: 0 }}>
                          Ending {payout.bankLast4 ?? "—"}
                        </td>
                        <td>
                          <span className={`ws-status ws-status-${payout.status === "PAID" ? "released" : "held"}`}>
                            <i /> {payout.status.toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="ws-kpis">
            <div className="ws-kpi ws-kpi-dark">
              <span className="ws-kpi-label">Buyer protection</span>
              <span className="ws-kpi-value">{money(buyerProtected)}</span>
              <span className="ws-kpi-note">Seller price currently protected across your deals</span>
            </div>
            <div className="ws-kpi">
              <span className="ws-kpi-label">Protection fees</span>
              <span className="ws-kpi-value">{money(buyerFees)}</span>
              <span className="ws-kpi-note">3% paid by you on top of seller prices</span>
            </div>
            <div className="ws-kpi">
              <span className="ws-kpi-label">Seller credits</span>
              <span className="ws-kpi-value">—</span>
              <span className="ws-kpi-note">Seller verification unlocks the credits and payout ledger</span>
            </div>
          </section>

          <section className="ws-panel" style={{ marginTop: 12 }}>
            <div className="ws-panel-head">
              <div>
                <small>Become a seller</small>
                <h2>Turn delivery into earnings</h2>
              </div>
              <Link href="/seller/verify">Start verification</Link>
            </div>
            <div className="ws-panel-body">
              <p className="ws-split-note">
                Once your seller profile is verified, released amounts appear here as credits you can
                request to withdraw. Payouts go only to the verified legal name and bank account.
              </p>
              <div style={{ marginTop: 16 }}>
                <Link className="ws-btn" href="/seller/verify">
                  Start seller verification <i>↗</i>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
