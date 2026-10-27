import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mutationGuard } from "@/lib/abuse";

const statementSchema = z.object({
  statement: z.string().trim().min(10, "Add at least 10 characters.").max(2_000),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guard = await mutationGuard(request, "dispute-statement", 12);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.status === 403 ? "Cross-origin request rejected." : "Too many statements. Try again later." },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to add a statement." }, { status: 401 });

  const { token } = await params;
  try {
    const input = statementSchema.parse(await request.json());
    const deal = await prisma.deal.findUnique({
      where: { publicToken: token },
      select: { id: true, status: true, buyerId: true, sellerId: true },
    });
    if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    if (deal.status !== "DISPUTED") return NextResponse.json({ error: "Statements are only open while a dispute is active." }, { status: 409 });

    const role = session.user.id === deal.buyerId ? "BUYER" : session.user.id === deal.sellerId ? "SELLER" : null;
    if (!role) return NextResponse.json({ error: "Only the buyer or seller can add a statement." }, { status: 403 });

    const event = await prisma.auditLog.create({
      data: {
        dealId: deal.id,
        actorId: session.user.id,
        action: "DISPUTE_STATEMENT",
        metadata: { statement: input.statement, role },
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ id: event.id, role, statement: input.statement, createdAt: event.createdAt });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Add a statement of at least 10 characters." }, { status: 400 });
    console.error("deal.dispute_statement_failed", error);
    return NextResponse.json({ error: "The statement could not be saved." }, { status: 500 });
  }
}
