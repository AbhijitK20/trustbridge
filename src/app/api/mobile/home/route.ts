import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mobileDealInclude, mobileStats, serializeMobileDeal } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  const deals = await prisma.deal.findMany({
    where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
    orderBy: { updatedAt: "desc" },
    include: mobileDealInclude,
  });
  return NextResponse.json({
    user,
    stats: mobileStats(deals),
    deals: deals.map(serializeMobileDeal),
  });
}
