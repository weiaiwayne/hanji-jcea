"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, BookOpen } from "lucide-react";

interface IssueRow {
  id: number;
  volume: number;
  number: number;
  year: number;
  title: string;
  article_count: number;
}
interface ArticleRow {
  id: number;
  title: string;
  authors_display: string;
  doi: string;
  issue_id: number;
  volume: number;
  number: number;
  year: number;
}

export default function ArchiveBrowser({
  issues,
  articles,
}: {
  issues: IssueRow[];
  articles: ArticleRow[];
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matches = q
    ? articles.filter((a) =>
        `${a.title} ${a.authors_display} ${a.doi}`.toLowerCase().includes(q)
      )
    : [];

  const volumes = [...new Set(issues.map((i) => i.volume))].sort((a, b) => b - a);

  return (
    <>
      <label className="relative mt-6 block max-w-lg">
        <span className="sr-only">Search articles</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles by title, author, or DOI…"
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm"
        />
      </label>

      {q ? (
        <section className="mt-6" aria-live="polite">
          <h2 className="text-lg font-semibold text-gray-900">
            {matches.length} result{matches.length === 1 ? "" : "s"} for “{query}”
          </h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {matches.map((a) => (
              <li key={a.id} className="py-3">
                <Link
                  href={`/article/${a.id}`}
                  className="font-serif font-semibold text-primary-900 hover:underline"
                >
                  {a.title}
                </Link>
                <p className="text-sm text-gray-600">
                  {a.authors_display} · Vol. {a.volume}, No. {a.number} ({a.year})
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        volumes.map((vol) => (
          <section key={vol} className="mt-8">
            <h2 className="border-b border-primary-100 pb-2 text-lg font-bold text-primary-800">
              Volume {vol}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {issues
                .filter((i) => i.volume === vol)
                .map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/issue/${i.id}`}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-500 hover:bg-teal-50/40"
                    >
                      <BookOpen className="mt-0.5 h-5 w-5 text-teal-600" aria-hidden="true" />
                      <span>
                        <span className="block font-semibold text-gray-900">
                          Vol. {i.volume}, No. {i.number} ({i.year})
                        </span>
                        {i.title && (
                          <span className="block text-sm text-gray-600">{i.title}</span>
                        )}
                        <span className="block text-xs text-gray-500">
                          {i.article_count} articles
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
