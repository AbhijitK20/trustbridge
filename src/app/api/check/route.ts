import { NextResponse } from "next/server";
import { clientAddress, mutationGuard, rateLimit } from "@/lib/abuse";
import { runCheck } from "@/lib/verification";
import { checkInputSchema } from "@/lib/verification/schema";
import type { ScenarioId } from "@/lib/verification";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-trustbridge-extension",
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { ...corsHeaders, ...(init?.headers ?? {}) } });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const fromExtension = request.headers.get("x-trustbridge-extension") === "1";
  const guard = fromExtension
    ? rateLimit(`check-extension:${clientAddress(request)}`, 30, 60_000)
    : await mutationGuard(request, "check", 30);

  if (!guard.allowed) {
    const status = "status" in guard && typeof guard.status === "number" ? guard.status : 429;
    return json(
      {
        error:
          status === 403
            ? "Request blocked. Refresh the page and try again."
            : "Too many checks from this address. Try again in a minute.",
      },
      {
        status,
        headers: guard.retryAfter > 0 ? { "Retry-After": String(guard.retryAfter) } : undefined,
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkInputSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const result = runCheck({
    ...input,
    scenario: input.scenario as ScenarioId | undefined,
  });

  return json(result);
}
