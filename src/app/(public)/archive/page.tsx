import { getDb } from "@/lib/db";
import type { Metadata } from "next";
import ArchiveBrowser from "./ArchiveBrowser";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Past Issues" };

export default function ArchivePage() {
  const db = getDb();
  const issues = db
    .prepare(
      `SELECT i.*, COUNT(a.id) AS article_count FROM issues i
       LEFT JOIN articles a ON a.issue_id = i.id
       WHERE i.status = 'published'
       GROUP BY i.id ORDER BY i.year DESC, i.volume DESC, i.number DESC`
    )
    .all() as {
    id: number;
    volume: number;
    number: number;
    year: number;
    title: string;
    published_at: string;
    article_count: number;
  }[];

  const articles = db
    .prepare(
      `SELECT a.id, a.title, a.authors_display, a.doi, a.issue_id, i.volume, i.number, i.year
       FROM articles a JOIN issues i ON i.id = a.issue_id
       WHERE i.status = 'published' AND a.published_at IS NOT NULL
       ORDER BY i.year DESC, a.order_in_issue`
    )
    .all() as {
    id: number;
    title: string;
    authors_display: string;
    doi: string;
    issue_id: number;
    volume: number;
    number: number;
    year: number;
  }[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-primary-900">Past Issues</h1>
      <p className="mt-2 text-gray-600">
        Browse the archive by volume and issue, or search across all published
        articles. Full texts are hosted on KoreaScience.
      </p>
      <ArchiveBrowser issues={issues} articles={articles} />
    </div>
  );
}
