"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { releasedForDeal } from "@/lib/credits";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard");
  return session.user.id;
}

export async function dashboardSignOut() {
  await signOut({ redirectTo: "/signin" });
}

export async function updateProfile(formData: FormData) {
  const userId = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) {
    redirect("/dashboard/profile?error=name");
  }
  await prisma.user.update({ where: { id: userId }, data: { name } });
  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile?saved=1");
}

export async function updateSettings(formData: FormData) {
  const userId = await requireUser();
  const timezone = String(formData.get("timezone") ?? "Asia/Kolkata");
  const currency = String(formData.get("currency") ?? "INR");
  const allowedTimezones = new Set(["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York", "UTC"]);
  const allowedCurrencies = new Set(["INR", "USD", "AED", "GBP"]);
  if (!allowedTimezones.has(timezone) || !allowedCurrencies.has(currency)) {
    redirect("/dashboard/settings?error=invalid");
  }
  const emailDeals = formData.get("emailDeals") === "on";
  const emailDisputes = formData.get("emailDisputes") === "on";
  const emailProduct = formData.get("emailProduct") === "on";
  await prisma.userSettings.upsert({
    where: { userId },
    update: { timezone, currency, emailDeals, emailDisputes, emailProduct },
    create: { userId, timezone, currency, emailDeals, emailDisputes, emailProduct },
  });
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  redirect("/dashboard/settings?saved=1");
}

export async function requestPayout(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/credits");

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      kyc: true,
      deals: { include: { milestones: true } },
      payoutRequests: { where: { status: { in: ["PENDING", "APPROVED", "PAID"] } } },
    },
  });
  if (!seller) redirect("/dashboard/credits?error=seller");

  const released = seller.deals.reduce((sum, deal) => sum + releasedForDeal(deal), 0);
  const committed = seller.payoutRequests.reduce((sum, payout) => sum + payout.amountCents, 0);
  const available = Math.max(0, released - committed);
  const rupees = Number(formData.get("amount"));
  const amountCents = Math.round(rupees * 100);

  if (!Number.isFinite(rupees) || amountCents < 10000 || amountCents > available) {
    redirect("/dashboard/credits?error=amount");
  }

  await prisma.payoutRequest.create({
    data: {
      sellerProfileId: seller.id,
      amountCents,
      currency: "INR",
      bankLast4: seller.kyc?.payoutAccountLast4 ?? null,
      note: "Requested from seller credits",
    },
  });
  revalidatePath("/dashboard/credits");
  redirect("/dashboard/credits?saved=1");
}
