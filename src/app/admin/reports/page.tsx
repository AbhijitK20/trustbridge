import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import ReportQueue from "./report-queue";

export default async function AdminReportsPage() {
  if (!(await requireAdmin())) redirect("/signin");
  const reports = await prisma.scamReport.findMany({ where: { status: { in: ["OPEN", "REVIEWING"] } }, orderBy: { createdAt: "asc" }, include: { seller: { select: { slug: true, user: { select: { name: true, email: true } } } }, reporter: { select: { name: true, email: true } }, deal: { select: { title: true, publicToken: true } } } });
  return <ReportQueue reports={reports} />;
}
