import { prisma } from "@/lib/prisma";
import { stripeClient, calculatePlatformFee } from "@/lib/stripe";

export function calculateFeeSplit(priceCents: number, depositCents: number) {
  const totalFee = calculatePlatformFee(priceCents);
  const effectiveDeposit = Math.max(0, Math.min(depositCents, priceCents));
  const depositFee = priceCents > 0 ? Math.round(totalFee * (effectiveDeposit / priceCents)) : 0;
  return {
    totalFee,
    depositCents: effectiveDeposit,
    balanceCents: priceCents - effectiveDeposit,
    depositFee,
    balanceFee: totalFee - depositFee,
  };
}

async function loadDeal(dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { sellerProfile: true } });
  if (!deal) throw new Error("Deal not found");
  return deal;
}

type PayoutDeal = Awaited<ReturnType<typeof loadDeal>>;

async function assertPayoutReady(deal: PayoutDeal) {
  if (!deal.stripePaymentId) throw new Error("Deal has no Stripe payment");
  if (!deal.sellerProfile.stripeAccountId) throw new Error("Seller has not completed Stripe onboarding");

  const stripe = stripeClient();
  const account = await stripe.accounts.retrieve(deal.sellerProfile.stripeAccountId);
  if (!account.payouts_enabled || !account.charges_enabled) throw new Error("Seller Stripe account is not ready for payouts");

  const paymentIntent = await stripe.paymentIntents.retrieve(deal.stripePaymentId);
  const chargeId = typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id;
  if (!chargeId) throw new Error("Stripe payment has no charge available for transfer");

  return { stripe, chargeId };
}

export async function releaseDepositDeal(dealId: string) {
  const deal = await loadDeal(dealId);
  if (deal.depositReleasedAt) return { alreadyReleased: true, transferId: deal.stripeDepositTransferId };

  if (!["DELIVERED", "CONFIRMED", "RELEASED"].includes(deal.status)) {
    throw new Error("The deposit can only be released after delivery");
  }

  const split = calculateFeeSplit(deal.priceCents, deal.depositCents);
  if (split.depositCents <= 0) {
    await prisma.deal.update({ where: { id: deal.id }, data: { depositReleasedAt: new Date() } });
    return { alreadyReleased: false, transferId: null, amount: 0, fee: 0 };
  }

  const { stripe, chargeId } = await assertPayoutReady(deal);
  const amount = Math.max(0, split.depositCents - split.depositFee);

  if (amount <= 0) {
    await prisma.deal.update({ where: { id: deal.id }, data: { depositReleasedAt: new Date() } });
    return { alreadyReleased: false, transferId: null, amount: 0, fee: split.depositFee };
  }

  const transfer = await stripe.transfers.create(
    {
      amount,
      currency: deal.currency,
      destination: deal.sellerProfile.stripeAccountId as string,
      source_transaction: chargeId,
      metadata: { dealId: deal.id, publicToken: deal.publicToken, stage: "DEPOSIT" },
    },
    { idempotencyKey: `trustbridge-deposit-${deal.id}` },
  );

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: deal.id },
      data: { depositReleasedAt: new Date(), stripeDepositTransferId: transfer.id },
    }),
    prisma.auditLog.create({
      data: { dealId: deal.id, action: "DEPOSIT_RELEASED", metadata: { transferId: transfer.id, amount, fee: split.depositFee } },
    }),
  ]);

  return { alreadyReleased: false, transferId: transfer.id, amount, fee: split.depositFee };
}

export async function releaseBalanceDeal(dealId: string) {
  const deal = await loadDeal(dealId);
  if (deal.balanceReleasedAt) return { alreadyReleased: true, transferId: deal.stripeTransferId };

  if (!["CONFIRMED", "RELEASED"].includes(deal.status)) {
    throw new Error("Only confirmed deals can release the balance");
  }

  if (!deal.depositReleasedAt) {
    await releaseDepositDeal(deal.id);
  }

  const split = calculateFeeSplit(deal.priceCents, deal.depositCents);
  const amount = Math.max(0, split.balanceCents - split.balanceFee);

  if (amount <= 0) {
    await prisma.$transaction([
      prisma.deal.update({
        where: { id: deal.id },
        data: { status: "RELEASED", balanceReleasedAt: new Date(), platformFeeCents: split.totalFee },
      }),
      prisma.auditLog.create({
        data: { dealId: deal.id, action: "BALANCE_RELEASED", metadata: { amount: 0, fee: split.balanceFee } },
      }),
      prisma.sellerProfile.update({ where: { id: deal.sellerProfileId }, data: { completedDeals: { increment: 1 } } }),
    ]);
    return { alreadyReleased: false, transferId: null, amount: 0, fee: split.balanceFee };
  }

  const { stripe, chargeId } = await assertPayoutReady(deal);
  const transfer = await stripe.transfers.create(
    {
      amount,
      currency: deal.currency,
      destination: deal.sellerProfile.stripeAccountId as string,
      source_transaction: chargeId,
      metadata: { dealId: deal.id, publicToken: deal.publicToken, stage: "BALANCE" },
    },
    { idempotencyKey: `trustbridge-balance-${deal.id}` },
  );

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: deal.id },
      data: { status: "RELEASED", balanceReleasedAt: new Date(), stripeTransferId: transfer.id, platformFeeCents: split.totalFee },
    }),
    prisma.auditLog.create({
      data: { dealId: deal.id, action: "BALANCE_RELEASED", metadata: { transferId: transfer.id, amount, fee: split.balanceFee } },
    }),
    prisma.sellerProfile.update({ where: { id: deal.sellerProfileId }, data: { completedDeals: { increment: 1 } } }),
  ]);

  return { alreadyReleased: false, transferId: transfer.id, amount, fee: split.balanceFee };
}

export async function releaseConfirmedDeal(dealId: string) {
  await releaseDepositDeal(dealId);
  return releaseBalanceDeal(dealId);
}
