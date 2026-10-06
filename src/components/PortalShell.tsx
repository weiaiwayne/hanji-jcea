import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import PortalTabs from "./PortalTabs";

import { api } from "@/lib/basePath";
export interface PortalTab {
  label: string;
  href: string;
  exact?: boolean;
}

export default function PortalShell({
  user,
  title,
  tabs,
  children,
}: {
  user: SessionUser;
  title: string;
  tabs: PortalTab[];
  children: React.ReactNode;
}) {
  const switchLinks: { label: string; href: string }[] = [];
  if (user.roles.includes("admin")) switchLinks.push({ label: "Admin", href: "/admin" });
  if (user.roles.includes("editor") || user.roles.includes("eic") || user.roles.includes("admin"))
    switchLinks.push({ label: "Editorial", href: "/editorial" });
  if (user.roles.includes("reviewer") || user.roles.includes("admin"))
    switchLinks.push({ label: "Reviewer", href: "/reviewer" });
  switchLinks.push({ label: "Author", href: "/author" });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200/80 bg-white shadow-[0_1px_3px_rgb(18_34_54_/_0.04)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-800 to-primary-950 font-serif text-base font-bold text-white ring-1 ring-primary-950/20 transition-opacity hover:opacity-90"
              aria-label="JCEA home"
            >
              東亞
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-teal-500 to-accent-500"
              />
            </Link>
            <div>
              <p className="font-serif text-[0.95rem] font-bold text-primary-950">{title}</p>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-gray-400">
                Journal of Contemporary Eastern Asia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {switchLinks.length > 1 && (
              <nav aria-label="Switch portal" className="hidden items-center gap-1 rounded-md bg-gray-100 p-1 sm:flex">
                {switchLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${
                      title.toLowerCase().startsWith(l.label.toLowerCase())
                        ? "bg-white text-primary-800 shadow-sm"
                        : "text-gray-600 hover:text-primary-700"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
            <span className="hidden text-gray-600 md:inline">{user.name}</span>
            <form action={api("/api/auth/logout")} method="post">
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <PortalTabs tabs={tabs} />
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
