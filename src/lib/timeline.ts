import { prisma } from "@/lib/prisma";

export type TimelineTone = "neutral" | "good" | "warn" | "bad";

export type TimelineItem = {
  id: string;
  at: Date;
  title: string;
  detail?: string;
  tone: TimelineTone;
};

const ACTION_COPY: Record<string, { title: string; tone: TimelineTone }> = {
  PAYMENT_HELD: { title: "Payment held", tone: "good" },
  DEMO_PAYMENT_HELD: { title: "Payment held (demo ledger)", tone: "good" },
  DELIVERY_SUBMITTED: { title: "Delivery submitted", tone: "neutral" },
  DELIVERY_SUBMITTED_SIMULATED: { title: "Delivery submitted (demo ledger)", tone: "neutral" },
  DEPOSIT_RELEASED: { title: "Deposit released to seller", tone: "good" },
  DEPOSIT_RELEASED_SIMULATED: { title: "Deposit released (demo ledger)", tone: "good" },
  BALANCE_RELEASED: { title: "Balance released to seller", tone: "good" },
  DELIVERY_CONFIRMED_SIMULATED: { title: "Balance released (demo ledger)", tone: "good" },
  DELIVERY_ACCEPTED_SIMULATED: { title: "Delivery accepted (demo ledger)", tone: "good" },
  DISPUTE_OPENED: { title: "Dispute opened", tone: "warn" },
  DISPUTE_STATEMENT: { title: "Statement added", tone: "neutral" },
  DISPUTE_REFUNDED: { title: "Refund recorded", tone: "bad" },
  DISPUTE_REFUNDED_SIMULATED: { title: "Refund recorded (demo ledger)", tone: "bad" },
  DISPUTE_RELEASE_APPROVED: { title: "Released to seller after review", tone: "good" },
  DISPUTE_RELEASE_SIMULATED: { title: "Released to seller (demo ledger)", tone: "good" },
  DELIVERY_REFUNDED_SIMULATED: { title: "Delivery refunded (demo ledger)", tone: "bad" },
  DELIVERY_ESCALATED: { title: "Delivery escalated to dispute", tone: "warn" },
  AUTO_RELEASE_ELIGIBLE: { title: "Review window elapsed", tone: "warn" },
  MILESTONE_SUBMITTED: { title: "Milestone submitted", tone: "neutral" },
  MILESTONE_CHANGES_REQUESTED: { title: "Milestone changes requested", tone: "warn" },
  MILESTONE_RELEASED: { title: "Milestone released", tone: "good" },
  CONTRACT_SIGNED: { title: "Contract signed", tone: "good" },
};

function humanize(action: string) {
  return action.replaceAll("_", " ").toLowerCase().replace(/^./, (char) => char.toUpperCase());
}

function metadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export async function getDealTimeline(dealId: string, createdAt: Date): Promise<TimelineItem[]> {
  const [audit, evidence, verification, disputes, consents] = await Promise.all([
    prisma.auditLog.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    }),
    prisma.evidence.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
      select: { id: true, fileName: true, createdAt: true },
    }),
    prisma.verificationCheck.findFirst({
      where: { deals: { some: { id: dealId } } },
      select: { id: true, outcome: true, createdAt: true },
    }),
    prisma.dispute.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, resolvedAt: true, reason: true },
    }),
    prisma.consent.findMany({
      where: { dealId, kind: { in: ["TERMS", "PAYOUT_AUTHORIZATION"] } },
      orderBy: { acceptedAt: "asc" },
      select: { id: true, kind: true, version: true, acceptedAt: true },
    }),
  ]);

  const items: TimelineItem[] = [
    { id: `deal:${dealId}`, at: createdAt, title: "Deal created", detail: "Agreement recorded before any money moved.", tone: "neutral" },
  ];

  const hasDisputeAudit = audit.some((event) => event.action === "DISPUTE_OPENED");

  for (const event of audit) {
    const copy = ACTION_COPY[event.action] ?? { title: humanize(event.action), tone: "neutral" as const };
    const statement = metadataString(event.metadata, "statement");
    const role = metadataString(event.metadata, "role");
    const note = metadataString(event.metadata, "note");
    const detail = statement
      ? `${role ? `${role.toLowerCase()}: ` : ""}${statement.slice(0, 160)}${statement.length > 160 ? "…" : ""}`
      : note ?? event.actor?.name ?? event.actor?.email;
    items.push({ id: `audit:${event.id}`, at: event.createdAt, title: copy.title, detail, tone: copy.tone });
  }

  if (!hasDisputeAudit) {
    for (const dispute of disputes) {
      items.push({ id: `dispute:${dispute.id}`, at: dispute.createdAt, title: "Dispute opened", detail: dispute.reason, tone: "warn" });
      if (dispute.resolvedAt) {
        items.push({ id: `dispute-resolved:${dispute.id}`, at: dispute.resolvedAt, title: "Dispute resolved", detail: "A human recorded the final decision.", tone: "good" });
      }
    }
  }

  for (const item of evidence) {
    items.push({ id: `evidence:${item.id}`, at: item.createdAt, title: "Delivery evidence added", detail: item.fileName, tone: "neutral" });
  }

  if (verification) {
    items.push({
      id: `verification:${verification.id}`,
      at: verification.createdAt,
      title: "Verification recorded",
      detail: verification.outcome.replaceAll("_", " ").toLowerCase(),
      tone: verification.outcome === "CONTRADICTED" ? "bad" : verification.outcome === "VERIFIED" ? "good" : "warn",
    });
  }

  for (const consent of consents) {
    items.push({
      id: `consent:${consent.id}`,
      at: consent.acceptedAt,
      title: consent.kind === "PAYOUT_AUTHORIZATION" ? "Payment authorisation accepted" : "Terms accepted",
      detail: `Version ${consent.version}`,
      tone: "neutral",
    });
  }

  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}
