"use client";

import { usePathname } from "next/navigation";

const LABELS: Array<[string, string]> = [
  ["/dashboard/deals", "Deals"],
  ["/dashboard/contracts", "Contracts"],
  ["/dashboard/checks", "Checks"],
  ["/dashboard/payments", "Payments"],
  ["/dashboard/credits", "Credits"],
  ["/dashboard/profile", "Profile"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard/notifications", "Notifications"],
  ["/dashboard/security", "Security"],
  ["/dashboard/help", "Help & legal"],
];

export default function WorkspaceCrumb({ role }: { role: string }) {
  const pathname = usePathname();
  const match = LABELS.find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return (
    <p className="ws-crumb">
      Workspace / <strong>{match?.[1] ?? "Overview"}</strong> · {role.toLowerCase()}
    </p>
  );
}
