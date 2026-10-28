import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const WALLET_ACTIONS = [
  "DEMO_CREDIT_TOPUP",
  "DEMO_CREDIT_TRANSFER_IN",
  "DEMO_CREDIT_TRANSFER_OUT",
] as const;

export type DemoWalletEntry = {
  action: string;
  amountCents: number;
  note: string;
  createdAt: Date;
};

function amountOf(metadata: Prisma.JsonValue): number {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const value = (metadata as Record<string, unknown>).amountCents;
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
}

function noteOf(metadata: Prisma.JsonValue): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const value = (metadata as Record<string, unknown>).note;
  return typeof value === "string" ? value : "";
}

export async function demoWallet(userId: string) {
  const rows = await prisma.auditLog.findMany({
    where: { actorId: userId, action: { in: [...WALLET_ACTIONS] } },
    orderBy: { createdAt: "desc" },
    select: { action: true, metadata: true, createdAt: true },
  });

  const balanceCents = rows.reduce((sum, row) => sum + amountOf(row.metadata), 0);
  const entries: DemoWalletEntry[] = rows.slice(0, 6).map((row) => ({
    action: row.action,
    amountCents: amountOf(row.metadata),
    note: noteOf(row.metadata),
    createdAt: row.createdAt,
  }));

  return { balanceCents: Math.max(0, balanceCents), entries };
}

export async function addDemoCredits(userId: string, amountCents: number, note: string) {
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "DEMO_CREDIT_TOPUP",
      metadata: { amountCents, note, simulated: true },
    },
  });
}

export async function moveDemoCredits(fromUserId: string, toEmail: string, amountCents: number) {
  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({ where: { id: fromUserId }, select: { id: true, email: true } }),
    prisma.user.findUnique({ where: { email: toEmail }, select: { id: true, email: true, name: true } }),
  ]);
  if (!sender) throw new Error("sender");
  if (!recipient) throw new Error("recipient");
  if (recipient.id === sender.id) throw new Error("self");

  const { balanceCents } = await demoWallet(sender.id);
  if (amountCents > balanceCents) throw new Error("balance");

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        actorId: sender.id,
        action: "DEMO_CREDIT_TRANSFER_OUT",
        metadata: {
          amountCents: -amountCents,
          note: `Sent to ${recipient.name ?? recipient.email}`,
          toUserId: recipient.id,
          toEmail: recipient.email,
          simulated: true,
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: recipient.id,
        action: "DEMO_CREDIT_TRANSFER_IN",
        metadata: {
          amountCents,
          note: `Received from ${sender.email}`,
          fromUserId: sender.id,
          fromEmail: sender.email,
          simulated: true,
        },
      },
    }),
  ]);

  return recipient;
}
