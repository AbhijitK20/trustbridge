"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function reviewPayout(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Not authorized");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["APPROVED", "PAID", "REJECTED"].includes(status)) return;
  await prisma.payoutRequest.update({
    where: { id },
    data: { status: status as "APPROVED" | "PAID" | "REJECTED", reviewedAt: new Date(), reviewedById: admin.id },
  });
  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard/credits");
}
