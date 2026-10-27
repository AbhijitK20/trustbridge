import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import DisputeQueue from "./dispute-queue";

export default async function AdminDisputesPage() {
  if (!(await requireAdmin())) redirect("/signin");
  const [disputes, deliveries] = await Promise.all([
    prisma.dispute.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        reporter: { select: { email: true, name: true } },
        deal: {
          select: {
            id: true,
            publicToken: true,
            title: true,
            description: true,
            priceCents: true,
            depositCents: true,
            balanceCents: true,
            currency: true,
            status: true,
            seller: { select: { email: true, name: true } },
            sellerProfile: { select: { kyc: { select: { kycStatus: true, sanctionsStatus: true, legalName: true, payoutAccountName: true } } } },
            buyer: { select: { email: true, name: true } },
            evidence: { orderBy: { createdAt: "asc" } },
            verificationCheck: { select: { id: true, outcome: true, decision: true, organization: true, createdAt: true, result: true } },
            auditEvents: {
              where: { action: "DISPUTE_STATEMENT" },
              orderBy: { createdAt: "asc" },
              select: { id: true, metadata: true, createdAt: true, actor: { select: { name: true, email: true } } },
            },
          },
        },
      },
    }),
    prisma.deal.findMany({
      where: { status: "DELIVERED" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        publicToken: true,
        title: true,
        description: true,
        priceCents: true,
        depositCents: true,
        balanceCents: true,
        currency: true,
        updatedAt: true,
        seller: { select: { email: true, name: true } },
        buyer: { select: { email: true, name: true } },
        evidence: { orderBy: { createdAt: "asc" } },
        verificationCheck: { select: { id: true, outcome: true, result: true } },
      },
    }),
  ]);
  return <DisputeQueue disputes={disputes} deliveries={deliveries} demoMode={process.env.DEMO_MODE === "true"} />;
}
