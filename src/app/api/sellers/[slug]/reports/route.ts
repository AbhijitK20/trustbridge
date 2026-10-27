import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalculateTrustScore } from "@/lib/trust";
import { mutationGuard } from "@/lib/abuse";

const reportSchema = z.object({ reason: z.string().trim().min(20).max(2_000), dealId: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const guard = await mutationGuard(request, "seller-report", 5);
  if (!guard.allowed) return NextResponse.json({ error: guard.status === 403 ? "Cross-origin request rejected." : "Too many report attempts. Try again later." }, { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to submit a report." }, { status: 401 });
  try {
    const input = reportSchema.parse(await request.json());
    const profile = await prisma.sellerProfile.findUnique({ where: { slug: (await params).slug }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "Seller not found." }, { status: 404 });
    const report = await prisma.scamReport.create({ data: { sellerId: profile.id, reporterId: session.user.id, dealId: input.dealId, reason: input.reason } });
    const trust = await recalculateTrustScore(profile.id);
    return NextResponse.json({ reportId: report.id, trust });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Report details must be at least 20 characters." }, { status: 400 });
    console.error("seller.report_failed", error);
    return NextResponse.json({ error: "Report could not be submitted." }, { status: 500 });
  }
}
