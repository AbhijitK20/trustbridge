"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    overview: (
      <>
        <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />
      </>
    ),
    deals: (
      <>
        <path d="m12 3 8 4.5-8 4.5-8-4.5zM4 12l8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
      </>
    ),
    checks: (
      <>
        <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    payments: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </>
    ),
    credits: (
      <>
        <ellipse cx="12" cy="6.5" rx="7" ry="3" />
        <path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
        <path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </>
    ),
    notifications: (
      <>
        <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
        <path d="M10.5 20a2 2 0 0 0 3 0" />
      </>
    ),
    security: (
      <>
        <path d="M12 3 5 6v5c0 4 3 7.4 7 9 4-1.6 7-5 7-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.2A2.6 2.6 0 0 1 12 7.5c1.5 0 2.5.9 2.5 2.1 0 1.6-2.5 1.8-2.5 3.6" />
        <path d="M12 17h.01" />
      </>
    ),
  };

  return (
    <svg className="ws-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: string; exact?: boolean; badge?: "deals" | "attention" }>;
}> = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
      { href: "/dashboard/deals", label: "Deals", icon: "deals", badge: "deals" },
      { href: "/dashboard/contracts", label: "Contracts", icon: "deals" },
      { href: "/dashboard/checks", label: "Checks", icon: "checks" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/dashboard/payments", label: "Payments", icon: "payments" },
      { href: "/dashboard/credits", label: "Credits", icon: "payments" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: "profile" },
      { href: "/dashboard/settings", label: "Settings", icon: "settings" },
      { href: "/dashboard/notifications", label: "Notifications", icon: "notifications", badge: "attention" },
      { href: "/dashboard/security", label: "Security", icon: "security" },
    ],
  },
  {
    label: "Support",
    items: [{ href: "/dashboard/help", label: "Help & legal", icon: "help" }],
  },
];

export default function DashNav({
  dealCount = 0,
  attentionCount = 0,
  mobile = false,
}: {
  dealCount?: number;
  attentionCount?: number;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const counts = { deals: dealCount, attention: attentionCount };

  if (mobile) {
    const flat = GROUPS.flatMap((group) => group.items);
    return (
      <nav className="ws-mobile-nav" aria-label="Workspace">
        {flat.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "is-active" : ""}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="ws-nav" aria-label="Workspace">
      {GROUPS.map((group) => (
        <div className="ws-nav-group" key={group.label}>
          <p className="ws-nav-label">{group.label}</p>
          {group.items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const badge = item.badge ? counts[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ws-nav-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={item.icon} />
                {item.label}
                {badge > 0 && <span className="ws-nav-count">{badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
