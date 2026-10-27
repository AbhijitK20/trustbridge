import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculatePlatformFee } from "@/lib/stripe";
import { legalEntity } from "@/lib/legal";
import LegalFooter from "@/components/legal-footer";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(cents / 100);
}

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const deal = await prisma.deal.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      publicToken: true,
      title: true,
      priceCents: true,
      depositCents: true,
      balanceCents: true,
      currency: true,
      status: true,
      stripePaymentId: true,
      platformFeeCents: true,
      createdAt: true,
      buyerId: true,
      sellerId: true,
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      sellerProfile: {
        select: {
          slug: true,
          kyc: { select: { legalName: true, entityType: true, taxIdLast4: true, payoutBankName: true, payoutAccountLast4: true } },
        },
      },
      consents: { where: { kind: "TERMS" }, orderBy: { acceptedAt: "desc" }, select: { userId: true, version: true, acceptedAt: true } },
    },
  });
  if (!deal) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?next=${encodeURIComponent(`/deal/${token}/receipt`)}`);

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isParticipant = session.user.id === deal.buyerId || session.user.id === deal.sellerId;
  if (!isParticipant && user?.role !== "ADMIN") notFound();
  if (["AWAITING_PAYMENT", "DRAFT", "EXPIRED"].includes(deal.status)) notFound();

  const kyc = deal.sellerProfile.kyc;
  const fee = deal.platformFeeCents || calculatePlatformFee(deal.priceCents);
  const sellerNet = Math.max(0, deal.priceCents - fee);
  const consent = deal.consents.find((item) => item.userId === deal.buyerId) ?? deal.consents[0];
  const paymentRef = deal.stripePaymentId?.startsWith("demo_") ? "Sandbox ledger (simulated)" : deal.stripePaymentId ?? "Not recorded";

  return (
    <main className="receipt-page">
      <nav className="topbar check-topbar">
        <Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link>
        <div className="nav-links">
          <Link href={`/deal/${deal.publicToken}`}>Back to deal</Link>
          <Link href="/legal/refunds">Refund policy</Link>
        </div>
      </nav>

      <div className="receipt-shell">
        <header className="receipt-head">
          <div>
            <p className="eyebrow">Payment receipt</p>
            <h1>Receipt #{deal.publicToken.slice(-8).toUpperCase()}</h1>
            <p>{deal.title}</p>
          </div>
          <span className="receipt-status">{deal.status.replaceAll("_", " ")}</span>
        </header>

        <section className="receipt-card">
          <div className="receipt-grid">
            <div>
              <p className="card-label">PAID BY</p>
              <p><strong>{deal.buyer?.name ?? "Buyer"}</strong><br />{deal.buyer?.email}</p>
            </div>
            <div>
              <p className="card-label">PAID TO</p>
              <p><strong>{kyc?.legalName ?? deal.seller?.name ?? deal.seller?.email}</strong><br />{kyc?.entityType ? kyc.entityType.replaceAll("_", " ").toLowerCase() : "Seller"}{kyc?.taxIdLast4 ? ` · Tax ID ending ${kyc.taxIdLast4}` : ""}</p>
              {kyc?.payoutAccountLast4 && <small>Payout: {kyc.payoutBankName} ending {kyc.payoutAccountLast4}</small>}
            </div>
            <div>
              <p className="card-label">DATE</p>
              <p>{new Date(deal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <div>
              <p className="card-label">PAYMENT REFERENCE</p>
              <p className="receipt-ref">{paymentRef}</p>
            </div>
          </div>

          <div className="receipt-lines">
            <div className="receipt-row"><span>Deal total</span><strong>{money(deal.priceCents, deal.currency)}</strong></div>
            <div className="receipt-row"><span>Deposit</span><span>{money(deal.depositCents, deal.currency)}</span></div>
            <div className="receipt-row"><span>Balance</span><span>{money(deal.balanceCents, deal.currency)}</span></div>
            <div className="receipt-row"><span>Platform fee (from seller payout)</span><span>{money(fee, deal.currency)}</span></div>
            <div className="receipt-row"><span>Seller receives after fee</span><span>{money(sellerNet, deal.currency)}</span></div>
            <div className="receipt-row receipt-total"><span>Protected amount</span><strong>{money(deal.priceCents, deal.currency)}</strong></div>
          </div>

          <div className="receipt-consent">
            <p className="card-label">CONSENT</p>
            <p>Terms version {consent?.version ?? legalEntity.termsVersion}{consent ? ` accepted ${new Date(consent.acceptedAt).toLocaleString("en-IN")}` : ""}.</p>
            <p>Deposit and balance are release milestones of the protected amount, not separate charges. TrustBridge is a technology platform, not a bank or licensed escrow. Payments are processed and held by {legalEntity.paymentPartner}. Refunds and releases are subject to the <Link href="/legal/refunds">Refund & Dispute Policy</Link>.</p>
          </div>
        </section>
      </div>

      <LegalFooter />
    </main>
  );
}
