import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { clientAddress, mutationGuard } from "@/lib/abuse";
import { signContract } from "@/lib/contracts";

export const runtime = "nodejs";

const signSchema = z.object({
  name: z.string().trim().min(2).max(80),
  signatureText: z.string().trim().min(2).max(80),
  consent: z.literal(true),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const guard = await mutationGuard(request, "contract-sign", 10);
  if (!guard.allowed) {
    return NextResponse.json(
      {
        error:
          guard.status === 403
            ? "Cross-origin request rejected."
            : "Too many signature attempts. Try again later.",
      },
      { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } },
    );
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in as the buyer or seller to sign." }, { status: 401 });
  }

  try {
    const { token } = await params;
    const input = signSchema.parse(await request.json());
    const result = await signContract({
      token,
      userId: session.user.id,
      email: session.user.email,
      name: input.name,
      signatureText: input.signatureText,
      ipAddress: clientAddress(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    revalidatePath(`/deal/${token}`);
    revalidatePath(`/deal/${token}/contract`);
    revalidatePath(`/app/deals/${token}`);

    return NextResponse.json({
      status: result.signed ? "SIGNED" : "PARTIALLY_SIGNED",
      role: result.role,
      message: result.signed
        ? "Contract signed by both parties."
        : "Signature recorded. Waiting for the other party.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter your name, signature, and consent." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "The signature could not be recorded.";
    const status = /not found|only the buyer|already signed/i.test(message) ? 409 : 500;
    console.error("contract.sign_failed", error);
    return NextResponse.json({ error: message }, { status });
  }
}
