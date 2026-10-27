type CreditDeal = {
  status: string;
  priceCents: number;
  depositCents: number;
  balanceCents: number;
  depositReleasedAt: Date | null;
  balanceReleasedAt: Date | null;
  milestones: Array<{ status: string; amountCents: number }>;
};

export function releasedForDeal(deal: CreditDeal) {
  if (deal.status === "REFUNDED") return 0;
  if (deal.status === "RELEASED") return deal.priceCents;
  if (deal.milestones.length > 0) {
    return deal.milestones
      .filter((milestone) => milestone.status === "RELEASED")
      .reduce((sum, milestone) => sum + milestone.amountCents, 0);
  }
  return (
    (deal.depositReleasedAt ? deal.depositCents : 0) +
    (deal.balanceReleasedAt ? deal.balanceCents : 0)
  );
}

export function sellerCreditSummary(
  deals: CreditDeal[],
  payouts: Array<{ amountCents: number; status: string }>,
) {
  const released = deals.reduce((sum, deal) => sum + releasedForDeal(deal), 0);
  const pending = payouts
    .filter((payout) => payout.status === "PENDING" || payout.status === "APPROVED")
    .reduce((sum, payout) => sum + payout.amountCents, 0);
  const paid = payouts
    .filter((payout) => payout.status === "PAID")
    .reduce((sum, payout) => sum + payout.amountCents, 0);
  return {
    released,
    pending,
    paid,
    available: Math.max(0, released - pending - paid),
  };
}
