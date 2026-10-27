import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseConfirmedDeal } from "@/lib/payouts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const deals = await prisma.deal.findMany({
    where: {
      OR: [
        { status: "DELIVERED", autoReleaseAt: { lte: new Date() } },
        { status: "CONFIRMED", balanceReleasedAt: null },
      ],
    },
    select: { id: true, status: true },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });
  const results = { released: 0, pending: 0, failed: 0 };

  for (const deal of deals) {
    try {
      if (deal.status === "DELIVERED") {
        await prisma.deal.updateMany({ where: { id: deal.id, status: "DELIVERED" }, data: { status: "CONFIRMED" } });
        await prisma.auditLog.create({ data: { dealId: deal.id, action: "AUTO_RELEASE_ELIGIBLE" } });
      }

      await releaseConfirmedDeal(deal.id);
      results.released += 1;
    } catch (error) {
      const current = await prisma.deal.findUnique({ where: { id: deal.id }, select: { status: true, balanceReleasedAt: true } });
      if (current?.status === "CONFIRMED" && !current.balanceReleasedAt) results.pending += 1;
      else results.failed += 1;
      console.error("cron.auto_release_failed", { dealId: deal.id, error });
    }
  }

  return NextResponse.json({ processed: deals.length, results });
}
