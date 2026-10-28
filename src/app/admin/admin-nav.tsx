"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/money", label: "Money" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminNav({ section }: { section: string }) {
  const pathname = usePathname();
  return (
    <nav className="topbar admin-topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">T</span> trustbridge
      </Link>
      <div className="nav-links">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={active ? "is-active" : undefined}>
              {item.label}
            </Link>
          );
        })}
        <span className="deal-nav-label">Admin · {section}</span>
      </div>
    </nav>
  );
}
