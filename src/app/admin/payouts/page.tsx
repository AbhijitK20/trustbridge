import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { reviewPayout } from "./actions";
import AdminNav from "../admin-nav";

function money(cents: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function AdminPayoutsPage() {
  if (!(await requireAdmin())) redirect("/signin");

  const [payouts, paid] = await Promise.all([
    prisma.payoutRequest.findMany({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      orderBy: { createdAt: "asc" },
      include: { sellerProfile: { include: { user: { select: { name: true, email: true } }, kyc: true } } },
    }),
    prisma.payoutRequest.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
      _count: true,
    }),
  ]);

  const pending = payouts.filter((item) => item.status === "PENDING");
  const approved = payouts.filter((item) => item.status === "APPROVED");
  const pendingTotal = pending.reduce((sum, item) => sum + item.amountCents, 0);
  const approvedTotal = approved.reduce((sum, item) => sum + item.amountCents, 0);

  return (
    <main className="admin-page">
      <AdminNav section="payouts" />

      <header className="admin-header">
        <p className="eyebrow">Seller credits · test-mode payout</p>
        <h1>Release the <em>earnings.</em></h1>
        <p>
          Review seller credit withdrawals. Marking paid is an accounting action in test mode; it
          does not move real money.
        </p>
      </header>

      <section className="dispute-list">
        <article className="dispute-card">
          <div className="dispute-meta">
            <span className="status-pill"><b /> {payouts.length} open requests</span>
            <span className="small-muted">TEST MODE · NO REAL MONEY</span>
          </div>
          <div className="dispute-grid payout-summary">
            <div>
              <strong>{money(pendingTotal)}</strong>
              <small>{pending.length} pending · waiting for a first review</small>
            </div>
            <div>
              <strong>{money(approvedTotal)}</strong>
              <small>{approved.length} approved · waiting to be marked paid</small>
            </div>
            <div>
              <strong>{money(paid._sum.amountCents ?? 0)}</strong>
              <small>{paid._count} paid all-time · accounting only</small>
            </div>
          </div>
        </article>

        {payouts.length === 0 ? (
          <section className="empty-state">
            <p className="eyebrow">Queue clear</p>
            <h2>No payout requests.</h2>
            <p>Seller withdrawal requests will appear here. Nothing is waiting on a reviewer.</p>
            <Link className="button-primary" href="/admin/money">
              Back to the money desk ↗
            </Link>
          </section>
        ) : (
          payouts.map((payout) => (
            <article className="dispute-card" key={payout.id}>
              <div className="dispute-meta">
                <span className="status-pill"><b /> {payout.status.toLowerCase()}</span>
                <strong>{money(payout.amountCents)}</strong>
              </div>
              <h2>{payout.sellerProfile.user.name ?? payout.sellerProfile.user.email}</h2>
              <p className="small-muted">
                {payout.sellerProfile.kyc?.payoutBankName ?? "No bank"} · ending{" "}
                {payout.bankLast4 ?? "—"} · requested{" "}
                {new Date(payout.createdAt).toLocaleDateString("en-IN")} ·{" "}
                {payout.sellerProfile.kyc?.payoutAccountName ?? "No account name"}
              </p>
              <div className="action-row">
                <form action={reviewPayout}>
                  <input type="hidden" name="id" value={payout.id} />
                  <input type="hidden" name="status" value="PAID" />
                  <button className="button-primary" type="submit">Mark paid (test)</button>
                </form>
                <form action={reviewPayout}>
                  <input type="hidden" name="id" value={payout.id} />
                  <input type="hidden" name="status" value="REJECTED" />
                  <button className="button-danger" type="submit">Reject</button>
                </form>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
