import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const reports = await prisma.scamReport.findMany({
    where: { status: { in: ["OPEN", "REVIEWING"] } },
    orderBy: { createdAt: "asc" },
    include: { seller: { select: { slug: true, user: { select: { name: true, email: true } } } }, reporter: { select: { name: true, email: true } }, deal: { select: { title: true, publicToken: true } } },
  });
  return NextResponse.json(reports);
}
