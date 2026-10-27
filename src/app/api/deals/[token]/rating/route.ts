import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalculateTrustScore } from "@/lib/trust";
import { mutationGuard } from "@/lib/abuse";

const ratingSchema = z.object({ score: z.number().int().min(1).max(5), comment: z.string().trim().max(1_000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guard = await mutationGuard(request, "rating", 5);
  if (!guard.allowed) return NextResponse.json({ error: guard.status === 403 ? "Cross-origin request rejected." : "Too many rating attempts. Try again later." }, { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to leave a rating." }, { status: 401 });
  try {
    const input = ratingSchema.parse(await request.json());
    const deal = await prisma.deal.findUnique({ where: { publicToken: (await params).token }, select: { id: true, buyerId: true, sellerProfileId: true, status: true } });
    if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    if (deal.buyerId !== session.user.id) return NextResponse.json({ error: "Only the buyer can rate this deal." }, { status: 403 });
    if (deal.status !== "RELEASED") return NextResponse.json({ error: "Ratings open after funds are released." }, { status: 409 });
    const rating = await prisma.rating.create({ data: { dealId: deal.id, sellerId: deal.sellerProfileId, reviewerId: session.user.id, score: input.score, comment: input.comment } });
    const trust = await recalculateTrustScore(deal.sellerProfileId);
    return NextResponse.json({ rating, trust });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose a score from 1 to 5." }, { status: 400 });
    console.error("rating.create_failed", error);
    return NextResponse.json({ error: "Rating could not be saved. It may already exist." }, { status: 409 });
  }
}
