import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mutationGuard } from "@/lib/abuse";
import { runCheck } from "@/lib/verification";
import { checkInputSchema } from "@/lib/verification/schema";
import type { ScenarioId } from "@/lib/verification";

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "verification-store", 20);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.status === 403 ? "Cross-origin request rejected." : "Too many verification records. Try again later." },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const result = runCheck({
    ...input,
    scenario: input.scenario as ScenarioId | undefined,
  });

  try {
    const saved = await prisma.verificationCheck.create({
      data: {
        outcome: result.outcome,
        decision: result.decision,
        organization: input.organization,
        counterpartyEmail: input.counterpartyEmail || null,
        promise: input.promise,
        result: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ id: saved.id, createdAt: saved.createdAt, result }, { status: 201 });
  } catch (error) {
    console.error("verification.store_failed", error);
    return NextResponse.json({ error: "The verification could not be saved." }, { status: 500 });
  }
}
