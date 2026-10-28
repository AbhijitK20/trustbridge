import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import ApprovalQueue from "./approval-queue";
import AdminNav from "../admin-nav";

export default async function AdminApprovalsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/signin");

  const approvals = await prisma.adminApproval.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      deal: { select: { title: true, publicToken: true, priceCents: true, currency: true, status: true } },
      dispute: { select: { id: true, reason: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <main className="admin-page">
      <AdminNav section="approvals" />
      <header className="admin-header">
        <p className="eyebrow">Maker-checker · second reviewer</p>
        <h1>Check the <em>checker.</em></h1>
        <p>High-value refunds and releases wait here. The admin who requested the decision cannot approve it; a different admin must sign off.</p>
      </header>
      <ApprovalQueue approvals={approvals} viewerId={admin.id} demoMode={process.env.DEMO_MODE === "true"} />
    </main>
  );
}
