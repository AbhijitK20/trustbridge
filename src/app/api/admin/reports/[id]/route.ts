import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { sameOrigin } from "@/lib/abuse";
import { prisma } from "@/lib/prisma";
import { recalculateTrustScore } from "@/lib/trust";

const schema = z.object({ status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const report = await prisma.scamReport.findUnique({ where: { id: (await params).id } });
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    await prisma.$transaction([
      prisma.scamReport.update({ where: { id: report.id }, data: { status: input.status } }),
      prisma.auditLog.create({ data: { actorId: admin.id, action: "SCAM_REPORT_UPDATED", metadata: { reportId: report.id, status: input.status } } }),
    ]);
    const trust = await recalculateTrustScore(report.sellerId);
    return NextResponse.json({ status: input.status, trust });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
    console.error("admin.report_update_failed", error);
    return NextResponse.json({ error: "Report update failed." }, { status: 500 });
  }
}
