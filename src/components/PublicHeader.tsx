"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { api } from "@/lib/basePath";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const NAV: NavItem[] = [
  {
    label: "About",
    children: [
      { label: "About the Journal", href: "/about-journal" },
      { label: "Editorial Board", href: "/editorial-board" },
      { label: "Abstracting & Indexing", href: "/abstracting-indexing" },
      { label: "Best Paper Award", href: "/best-paper" },
    ],
  },
  {
    label: "Policies",
    children: [
      { label: "Editorial Process & Peer Review", href: "/editorial-process" },
      { label: "Publication Ethics", href: "/publication-ethics" },
      { label: "Copyright & Licence", href: "/copyright" },
      { label: "Author Fees & Business Model", href: "/author-fees" },
      { label: "Archiving & Preservation", href: "/archiving-and-preservation" },
    ],
  },
  {
    label: "Issues",
    children: [
      { label: "Current Issue", href: "/current-issue" },
      { label: "Past Issues", href: "/archive" },
    ],
  },
  {
    label: "For Authors",
    children: [
      { label: "Submission Guidelines", href: "/submission" },
      { label: "Call for Papers", href: "/call-for-papers" },
      ...(EDITORIAL_SYSTEM_ENABLED
        ? [{ label: "Submit a Manuscript", href: "/author" }]
        : []),
    ],
  },
  {
    label: "Events",
    children: [
      { label: "2026 JCEA Summer Workshop", href: "/2026-jcea-summer-workshop" },
      { label: "Triple Helix Conference 2025", href: "/conference" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export default function PublicHeader({
  user,
}: {
  user: { name: string; roles: string[] } | null;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  const portalHref = user
    ? user.roles.includes("admin")
      ? "/admin"
      : user.roles.includes("editor") || user.roles.includes("eic")
        ? "/editorial"
        : user.roles.includes("reviewer")
          ? "/reviewer"
          : "/author"
    : "/login";

  return (
    <header className="border-b border-gray-200/70 bg-white">
      <div className="bg-primary-950 text-primary-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5 text-xs">
          <span className="whitespace-nowrap tracking-wide">
            Open Access · Peer Reviewed · ISSN 2383-9449
          </span>
          {EDITORIAL_SYSTEM_ENABLED && (
          <div className="flex items-center gap-4 whitespace-nowrap">
            {user ? (
              <>
                <Link href={portalHref} className="hover:text-white hover:underline underline-offset-2">
                  My Dashboard
                </Link>
                <form action={api("/api/auth/logout")} method="post">
                  <button type="submit" className="hover:text-white hover:underline underline-offset-2">
                    Sign out ({user.name.split(" ")[0]})
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-white hover:underline underline-offset-2">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-white hover:bg-white/20"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden="true"
            className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-800 to-primary-950 font-serif text-xl font-bold text-white shadow-sm ring-1 ring-primary-950/20"
          >
            東亞
            <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-teal-500 to-accent-500" />
          </span>
          <span>
            <span className="block font-serif text-lg font-bold leading-tight tracking-tight text-primary-950 sm:text-xl">
              Journal of Contemporary Eastern Asia
            </span>
            <span className="mt-0.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-gray-400">
              East &amp; Southeast Asia · Networks · Communication
            </span>
          </span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-primary-800 hover:bg-primary-50 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <nav aria-label="Main navigation" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map((item) => (
              <li key={item.label} className="group relative">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-900 ${
                      pathname === item.href
                        ? "text-primary-900 underline decoration-teal-500 decoration-2 underline-offset-8"
                        : "text-gray-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-900"
                      aria-haspopup="true"
                    >
                      {item.label}
                      <ChevronDown
                        className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180"
                        aria-hidden="true"
                      />
                    </button>
                    <ul className="invisible absolute right-0 z-20 mt-1 w-60 rounded-xl border border-gray-200/80 bg-white py-1.5 opacity-0 shadow-[var(--shadow-pop)] transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children!.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className={`mx-1.5 block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary-50 hover:text-primary-900 ${
                              pathname === c.href
                                ? "font-semibold text-primary-900"
                                : "text-gray-600"
                            }`}
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {open && (
        <nav aria-label="Mobile navigation" className="border-t border-gray-100 lg:hidden">
          <ul className="space-y-1 px-4 py-3">
            {NAV.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50"
                      aria-expanded={expanded === item.label}
                      onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${expanded === item.label ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                    {expanded === item.label && (
                      <ul className="ml-3 space-y-1 border-l-2 border-teal-100 pl-3">
                        {item.children!.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className="block rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-primary-50"
                              onClick={() => setOpen(false)}
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
