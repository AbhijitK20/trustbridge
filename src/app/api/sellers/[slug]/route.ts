import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const profile = await prisma.sellerProfile.findUnique({ where: { slug: (await params).slug }, select: { slug: true, bio: true, completedDeals: true, averageRating: true, trustScore: true, user: { select: { name: true, image: true } }, ratings: { orderBy: { createdAt: "desc" }, take: 10, select: { score: true, comment: true, createdAt: true } }, reports: { where: { status: { in: ["OPEN", "REVIEWING"] } }, select: { id: true, reason: true, createdAt: true } } } });
  if (!profile) return NextResponse.json({ error: "Seller not found." }, { status: 404 });
  return NextResponse.json(profile);
}
