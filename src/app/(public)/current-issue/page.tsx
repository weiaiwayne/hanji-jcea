import { getDb } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import ArticleListItem, { type ArticleListRow } from "@/components/ArticleListItem";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Current Issue" };

export default function CurrentIssuePage() {
  const db = getDb();
  const issue = db
    .prepare(
      "SELECT * FROM issues WHERE status = 'published' ORDER BY year DESC, volume DESC, number DESC LIMIT 1"
    )
    .get() as
    | { id: number; volume: number; number: number; year: number; title: string; published_at: string }
    | undefined;

  const articles = issue
    ? (db
        .prepare("SELECT * FROM articles WHERE issue_id = ? AND published_at IS NOT NULL ORDER BY order_in_issue")
        .all(issue.id) as ArticleListRow[])
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
        Current Issue
      </p>
      {issue ? (
        <>
          <h1 className="mt-1 font-serif text-3xl font-bold text-primary-900">
            Volume {issue.volume}, Number {issue.number} ({issue.year})
          </h1>
          {issue.title && <p className="mt-1 text-lg text-gray-600">{issue.title}</p>}
          <p className="mt-1 text-sm text-gray-500">
            Published {fmtDate(issue.published_at)} · {articles.length} articles
          </p>
          <ul className="mt-6 divide-y divide-gray-100">
            {articles.map((a) => (
              <ArticleListItem key={a.id} article={a} />
            ))}
          </ul>
        </>
      ) : (
        <>
          <h1 className="mt-1 font-serif text-3xl font-bold text-primary-900">
            No published issue yet
          </h1>
          <p className="mt-3 text-gray-600">
            The next issue is in preparation. Browse{" "}
            <Link href="/archive" className="text-primary-600 underline">
              past issues
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
