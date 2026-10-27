import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { releaseConfirmedDeal } from "@/lib/payouts";
import { mutationGuard } from "@/lib/abuse";

const actionSchema = z.object({ action: z.enum(["confirm", "dispute"]), reason: z.string().trim().min(10).max(2_000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guard = await mutationGuard(request, "deal-action", 12);
  if (!guard.allowed) return NextResponse.json({ error: guard.status === 403 ? "Cross-origin request rejected." : "Too many action attempts. Try again later." }, { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } });
  const { token } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Sign in as the buyer to manage this deal." }, { status: 401 });
    const input = actionSchema.parse(await request.json());
    const deal = await prisma.deal.findUnique({ where: { publicToken: token }, include: { buyer: true } });
    if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    if (!deal.buyer || deal.buyerId !== session.user.id) return NextResponse.json({ error: "You are not the buyer for this deal." }, { status: 403 });
    if (deal.status !== "DELIVERED") return NextResponse.json({ error: "This deal is not awaiting a delivery decision." }, { status: 409 });
    if (input.action === "dispute" && !input.reason) return NextResponse.json({ error: "Explain what is wrong with the delivery." }, { status: 400 });
    if (input.action === "confirm") {
      if (process.env.DEMO_MODE === "true") {
        await prisma.$transaction([
          prisma.deal.update({ where: { id: deal.id }, data: { status: "RELEASED", balanceReleasedAt: new Date() } }),
          prisma.auditLog.create({ data: { dealId: deal.id, actorId: deal.buyerId, action: "DELIVERY_CONFIRMED_SIMULATED", metadata: { simulated: true, balanceReleased: true } } }),
        ]);
        return NextResponse.json({ status: "RELEASED", message: "Delivery confirmed. Demo ledger released the funds." });
      }
      await prisma.$transaction([
        prisma.deal.update({ where: { id: deal.id }, data: { status: "CONFIRMED" } }),
        prisma.auditLog.create({ data: { dealId: deal.id, actorId: deal.buyerId, action: "DELIVERY_CONFIRMED" } }),
      ]);
      try {
        await releaseConfirmedDeal(deal.id);
        return NextResponse.json({ status: "RELEASED", message: "Delivery confirmed and funds released to the seller." });
      } catch (releaseError) {
        console.error("deal.release_pending", { dealId: deal.id, releaseError });
        return NextResponse.json({ status: "CONFIRMED", message: "Delivery confirmed. Funds are protected while the seller completes payout setup." });
      }
    }
    await prisma.$transaction([
      prisma.deal.update({ where: { id: deal.id }, data: { status: "DISPUTED" } }),
      prisma.dispute.create({ data: { dealId: deal.id, reporterId: deal.buyerId as string, reason: input.reason as string } }),
      prisma.auditLog.create({ data: { dealId: deal.id, actorId: deal.buyerId, action: "DISPUTE_OPENED", metadata: { reason: input.reason } } }),
    ]);
    return NextResponse.json({ status: "DISPUTED", message: "Dispute opened. Funds remain protected while it is reviewed." });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Provide a valid action." }, { status: 400 });
    console.error("deal.action_failed", error);
    return NextResponse.json({ error: "The action could not be completed." }, { status: 500 });
  }
}
