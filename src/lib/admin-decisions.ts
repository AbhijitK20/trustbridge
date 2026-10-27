import { prisma } from "@/lib/prisma";
import { releaseConfirmedDeal } from "@/lib/payouts";
import { stripeClient } from "@/lib/stripe";

export type DisputeResolution = "REFUND_TO_BUYER" | "RELEASE_TO_SELLER";
export type DeliveryDecision = "ACCEPT" | "REFUND";

export async function executeDisputeResolution(input: {
  disputeId: string;
  resolution: DisputeResolution;
  note: string;
  adminId: string;
}) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId },
    include: { deal: true },
  });
  if (!dispute) throw new Error("Dispute not found.");
  if (dispute.resolvedAt) throw new Error("Dispute is already resolved.");
  if (dispute.deal.status !== "DISPUTED") throw new Error("Deal is not in a disputable state.");

  const deal = dispute.deal;
  const demoMode = process.env.DEMO_MODE === "true";

  if (input.resolution === "REFUND_TO_BUYER") {
    if (demoMode) {
      await prisma.$transaction([
        prisma.deal.update({ where: { id: deal.id }, data: { status: "REFUNDED" } }),
        prisma.dispute.update({
          where: { id: dispute.id },
          data: { resolution: "REFUND_TO_BUYER", decisionNote: input.note, decidedById: input.adminId, resolvedAt: new Date() },
        }),
        prisma.auditLog.create({
          data: { dealId: deal.id, actorId: input.adminId, action: "DISPUTE_REFUNDED_SIMULATED", metadata: { note: input.note, simulated: true } },
        }),
      ]);
      return { status: "REFUNDED", simulated: true };
    }

    if (!deal.stripePaymentId) throw new Error("Deal has no Stripe payment to refund.");
    const refund = await stripeClient().refunds.create(
      { payment_intent: deal.stripePaymentId, metadata: { dealId: deal.id, disputeId: dispute.id } },
      { idempotencyKey: `trustbridge-refund-${deal.id}` },
    );
    await prisma.$transaction([
      prisma.deal.update({ where: { id: deal.id }, data: { status: "REFUNDED" } }),
      prisma.dispute.update({
        where: { id: dispute.id },
        data: { resolution: "REFUND_TO_BUYER", decisionNote: input.note, decidedById: input.adminId, resolvedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: { dealId: deal.id, actorId: input.adminId, action: "DISPUTE_REFUNDED", metadata: { refundId: refund.id, note: input.note } },
      }),
    ]);
    return { status: "REFUNDED", refundId: refund.id };
  }

  if (demoMode) {
    await prisma.$transaction([
      prisma.deal.update({ where: { id: deal.id }, data: { status: "RELEASED", balanceReleasedAt: new Date() } }),
      prisma.dispute.update({
        where: { id: dispute.id },
        data: { resolution: "RELEASE_TO_SELLER", decisionNote: input.note, decidedById: input.adminId, resolvedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: { dealId: deal.id, actorId: input.adminId, action: "DISPUTE_RELEASE_SIMULATED", metadata: { note: input.note, simulated: true } },
      }),
    ]);
    return { status: "RELEASED", simulated: true };
  }

  await prisma.$transaction([
    prisma.deal.update({ where: { id: deal.id }, data: { status: "CONFIRMED" } }),
    prisma.dispute.update({
      where: { id: dispute.id },
      data: { resolution: "RELEASE_TO_SELLER", decisionNote: input.note, decidedById: input.adminId, resolvedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: { dealId: deal.id, actorId: input.adminId, action: "DISPUTE_RELEASE_APPROVED", metadata: { note: input.note } },
    }),
  ]);

  try {
    const transfer = await releaseConfirmedDeal(deal.id);
    return { status: "RELEASED", transferId: transfer.transferId };
  } catch (error) {
    console.error("admin.dispute_release_pending", { dealId: deal.id, error });
    return { status: "CONFIRMED", error: "Decision saved, but the seller payout is not ready." };
  }
}

export async function executeDeliveryDecision(input: {
  dealId: string;
  decision: DeliveryDecision;
  note: string;
  adminId: string;
}) {
  const deal = await prisma.deal.findUnique({ where: { id: input.dealId } });
  if (!deal) throw new Error("Deal not found.");
  if (deal.status !== "DELIVERED") throw new Error("This delivery is not awaiting review.");

  const demoMode = process.env.DEMO_MODE === "true";

  if (input.decision === "ACCEPT") {
    if (demoMode) {
      await prisma.$transaction([
        prisma.deal.update({ where: { id: deal.id }, data: { status: "RELEASED", balanceReleasedAt: new Date() } }),
        prisma.auditLog.create({
          data: { dealId: deal.id, actorId: input.adminId, action: "DELIVERY_ACCEPTED_SIMULATED", metadata: { simulated: true, note: input.note } },
        }),
      ]);
      return { status: "RELEASED", simulated: true };
    }

    await prisma.$transaction([
      prisma.deal.update({ where: { id: deal.id }, data: { status: "CONFIRMED" } }),
      prisma.auditLog.create({
        data: { dealId: deal.id, actorId: input.adminId, action: "DELIVERY_ACCEPTED", metadata: { note: input.note } },
      }),
    ]);

    try {
      const transfer = await releaseConfirmedDeal(deal.id);
      return { status: "RELEASED", transferId: transfer.transferId };
    } catch (error) {
      console.error("admin.delivery_release_pending", { dealId: deal.id, error });
      return { status: "CONFIRMED", error: "Delivery accepted, but the seller payout is not ready." };
    }
  }

  if (demoMode) {
    await prisma.$transaction([
      prisma.deal.update({ where: { id: deal.id }, data: { status: "REFUNDED" } }),
      prisma.auditLog.create({
        data: { dealId: deal.id, actorId: input.adminId, action: "DELIVERY_REFUNDED_SIMULATED", metadata: { simulated: true, note: input.note } },
      }),
    ]);
    return { status: "REFUNDED", simulated: true };
  }

  if (!deal.stripePaymentId) throw new Error("This deal has no Stripe payment to refund.");
  const refund = await stripeClient().refunds.create(
    { payment_intent: deal.stripePaymentId, metadata: { dealId: deal.id } },
    { idempotencyKey: `trustbridge-delivery-refund-${deal.id}` },
  );
  await prisma.$transaction([
    prisma.deal.update({ where: { id: deal.id }, data: { status: "REFUNDED" } }),
    prisma.auditLog.create({
      data: { dealId: deal.id, actorId: input.adminId, action: "DELIVERY_REFUNDED", metadata: { refundId: refund.id, note: input.note } },
    }),
  ]);
  return { status: "REFUNDED", refundId: refund.id };
}
