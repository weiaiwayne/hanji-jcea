"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalTab } from "./PortalShell";

export default function PortalTabs({ tabs }: { tabs: PortalTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Portal sections" className="mx-auto w-full max-w-6xl overflow-x-auto px-4">
      <ul className="-mb-px flex gap-1">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`inline-block whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-teal-500 font-semibold text-primary-900"
                    : "border-transparent font-medium text-gray-500 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
