import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const disputes = await prisma.dispute.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { email: true, name: true } },
      deal: { select: { id: true, publicToken: true, title: true, description: true, priceCents: true, currency: true, status: true, createdAt: true, seller: { select: { email: true, name: true } }, buyer: { select: { email: true, name: true } }, evidence: { orderBy: { createdAt: "asc" } } } },
    },
  });
  return NextResponse.json(disputes);
}
