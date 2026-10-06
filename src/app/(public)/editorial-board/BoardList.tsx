"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { BoardMember } from "./page";

const ROLE_ORDER = [
  "Editor-in-Chief",
  "Founding Editor-in-Chief",
  "Managing Editor",
  "Managing Editor & Book Review Editor",
  "Book Review Editor",
  "Associate Editor",
  "Assistant Managing Editor",
  "Social Media Coordinator",
  "Editorial Board",
  "Advisory Board",
  "Former Managing Editor",
  "Former Associate Editor",
];

export default function BoardList({ members }: { members: BoardMember[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [country, setCountry] = useState("all");

  const roles = useMemo(() => {
    const present = new Set(members.map((m) => m.role));
    return ROLE_ORDER.filter((r) => present.has(r)).concat(
      [...present].filter((r) => !ROLE_ORDER.includes(r)).sort()
    );
  }, [members]);

  const countries = useMemo(
    () => [...new Set(members.map((m) => m.country).filter(Boolean))].sort(),
    [members]
  );

  const filtered = members.filter((m) => {
    if (role !== "all" && m.role !== role) return false;
    if (country !== "all" && m.country !== country) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${m.name} ${m.affiliation} ${m.researchAreas.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const groups = roles
    .map((r) => ({ role: r, members: filtered.filter((m) => m.role === r) }))
    .filter((g) => g.members.length > 0);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-56">
          <span className="sr-only">Search board members</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, affiliation, or research area…"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm"
          />
        </label>
        <label className="text-sm text-gray-600">
          <span className="sr-only">Filter by role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-2 pr-8 text-sm shadow-sm"
          >
            <option value="all">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-600">
          <span className="sr-only">Filter by country</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-2 pr-8 text-sm shadow-sm"
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 text-sm text-gray-500" aria-live="polite">
        Showing {filtered.length} of {members.length} members
      </p>

      {groups.map((g) => (
        <section key={g.role} className="mt-8">
          <h2 className="border-b border-primary-100 pb-2 text-lg font-bold text-primary-800">
            {g.role}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.members.map((m) => (
              <li
                key={m.id}
                className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 font-serif text-lg font-bold text-primary-700"
                >
                  {m.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-sm text-gray-600">{m.affiliation}</p>
                  {m.country && <p className="text-xs text-gray-500">{m.country}</p>}
                  {m.researchAreas.length > 0 && (
                    <p className="mt-1.5 flex flex-wrap gap-1">
                      {m.researchAreas.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700"
                        >
                          {a}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {filtered.length === 0 && (
        <p className="mt-10 text-center text-gray-500">
          No members match your filters.
        </p>
      )}
    </>
  );
}
