import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { stripeClient } from "@/lib/stripe";
import { mutationGuard } from "@/lib/abuse";

export async function POST(request: Request) {
  const guard = await mutationGuard(request, "connect-onboarding", 4);
  if (!guard.allowed) return NextResponse.json({ error: guard.status === 403 ? "Cross-origin request rejected." : "Too many onboarding attempts. Try again later." }, { status: guard.status, headers: { "Retry-After": String(guard.retryAfter) } });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to onboard as a seller." }, { status: 401 });
  try {
    const stripe = stripeClient();
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } });
    if (!profile) return NextResponse.json({ error: "Create a deal first to create your seller profile." }, { status: 409 });
    let accountId = profile.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express", email: session.user.email ?? undefined, capabilities: { transfers: { requested: true } }, metadata: { userId: session.user.id } });
      accountId = account.id;
      await prisma.sellerProfile.update({ where: { id: profile.id }, data: { stripeAccountId: accountId } });
    }
    const link = await stripe.accountLinks.create({ account: accountId, type: "account_onboarding", refresh_url: env.STRIPE_CONNECT_REFRESH_URL, return_url: env.STRIPE_CONNECT_RETURN_URL });
    return NextResponse.json({ url: link.url });
  } catch (error) {
    console.error("connect.onboarding_failed", error);
    return NextResponse.json({ error: "Seller onboarding could not be started." }, { status: 500 });
  }
}
