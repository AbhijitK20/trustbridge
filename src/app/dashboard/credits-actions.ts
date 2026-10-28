"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { demoModeEnabled } from "@/lib/demo-mode";
import { addDemoCredits, moveDemoCredits } from "@/lib/demo-credits";

const MAX_CENTS = 10_000_000;

function back(query: string): never {
  redirect(`/dashboard/credits?${query}`);
}

function amountFrom(formData: FormData) {
  const rupees = Number(formData.get("amount"));
  if (!Number.isFinite(rupees)) return null;
  const cents = Math.round(rupees * 100);
  if (cents < 100 || cents > MAX_CENTS) return null;
  return cents;
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/dashboard/credits");
  return session.user.id;
}

export async function addDemoCreditAction(formData: FormData) {
  const userId = await requireUser();
  if (!demoModeEnabled()) back("error=demo_off");
  const amountCents = amountFrom(formData);
  if (!amountCents) back("error=demo_amount");

  await addDemoCredits(userId, amountCents, "Sandbox top-up");
  revalidatePath("/dashboard/credits");
  back(`topup=${Math.round(amountCents / 100)}`);
}

export async function moveDemoCreditAction(formData: FormData) {
  const userId = await requireUser();
  if (!demoModeEnabled()) back("error=demo_off");
  const amountCents = amountFrom(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!amountCents) back("error=demo_amount");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("error=demo_recipient");

  let recipientEmail: string;
  try {
    const recipient = await moveDemoCredits(userId, email, amountCents);
    recipientEmail = recipient.email;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "recipient") back("error=demo_recipient");
    if (reason === "self") back("error=demo_self");
    if (reason === "balance") back("error=demo_balance");
    back("error=demo_failed");
  }

  revalidatePath("/dashboard/credits");
  back(`moved=${Math.round(amountCents / 100)}&to=${encodeURIComponent(recipientEmail)}`);
}
