"use client";

import { usePathname } from "next/navigation";

const LABELS: Array<[string, string]> = [
  ["/dashboard/deals", "Deals"],
  ["/dashboard/new", "New deal"],
  ["/dashboard/contracts", "Contracts"],
  ["/dashboard/checks", "Checks"],
  ["/dashboard/disputes", "Disputes"],
  ["/dashboard/reviews", "Reviews"],
  ["/dashboard/activity", "Activity"],
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
