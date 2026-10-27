import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import ComplianceQueue from "./compliance-queue";

export default async function AdminCompliancePage() {
  if (!(await requireAdmin())) redirect("/signin");

  const sellers = await prisma.sellerProfile.findMany({
    where: {
      kyc: {
        is: {
          OR: [
            { kycStatus: { in: ["PENDING", "REJECTED"] } },
            { sanctionsStatus: { in: ["REVIEW", "HIT"] } },
          ],
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      isVerified: true,
      user: { select: { name: true, email: true } },
      kyc: {
        select: {
          legalName: true,
          entityType: true,
          taxIdLast4: true,
          kycStatus: true,
          sanctionsStatus: true,
          payoutAccountName: true,
          payoutBankName: true,
          payoutAccountLast4: true,
          updatedAt: true,
        },
      },
    },
  });

  return (
    <main className="admin-page">
      <nav className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link>
        <div className="nav-links">
          <Link href="/admin/disputes">Disputes</Link>
          <Link href="/admin/approvals">Approvals</Link>
          <Link href="/admin/reports">Reports</Link>
          <span className="deal-nav-label">Admin · compliance</span>
        </div>
      </nav>
      <header className="admin-header">
        <p className="eyebrow">KYC · sanctions · payout ownership</p>
        <h1>Verify the <em>seller.</em></h1>
        <p>Legal identity, payout-name match, and sanctions status. A human approves before the verified badge or payout is enabled.</p>
      </header>
      <ComplianceQueue sellers={sellers} demoMode={process.env.DEMO_MODE === "true"} />
    </main>
  );
}
