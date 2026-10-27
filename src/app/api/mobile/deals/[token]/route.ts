import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mobileDealInclude, serializeMobileDeal } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { token } = await params;
  const deal = await prisma.deal.findUnique({
    where: { publicToken: token },
    include: mobileDealInclude,
  });
  if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  const participant = await prisma.deal.findUnique({
    where: { id: deal.id },
    select: { buyerId: true, sellerId: true },
  });
  const isBuyer = participant?.buyerId === session.user.id;
  const isSeller = participant?.sellerId === session.user.id;
  if (!isBuyer && !isSeller) return NextResponse.json({ error: "Not your deal." }, { status: 403 });
  return NextResponse.json({
    deal: serializeMobileDeal(deal),
    viewer: { isBuyer, isSeller },
    demoMode: process.env.DEMO_MODE === "true",
  });
}
