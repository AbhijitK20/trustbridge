import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import AppNav from "./app-nav";

export const dynamic = "force-dynamic";

function initials(name: string | null | undefined) {
  if (!name) return "T";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/app");

  return (
    <div className="app-shell">
      <div className="app-phone">
        <header className="app-topbar">
          <Link className="app-brand" href="/app">
            <span className="brand-mark">T</span>
            <span>
              trustbridge
              <small>protected workspace</small>
            </span>
          </Link>
          <div className="app-topbar-right">
            <Link className="app-avatar" href="/app/profile" aria-label="Profile">
              {initials(session.user.name)}
            </Link>
          </div>
        </header>
        <main className="app-main">{children}</main>
        <AppNav />
      </div>
    </div>
  );
}
