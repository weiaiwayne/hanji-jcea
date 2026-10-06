import { getDb } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import ArticleListItem, { type ArticleListRow } from "@/components/ArticleListItem";
import { Breadcrumbs } from "@/components/ui";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const issue = db
    .prepare("SELECT * FROM issues WHERE id = ? AND status = 'published'")
    .get(Number(id)) as
    | { id: number; volume: number; number: number; year: number; title: string; published_at: string }
    | undefined;
  if (!issue) notFound();

  const articles = db
    .prepare(
      "SELECT * FROM articles WHERE issue_id = ? AND published_at IS NOT NULL ORDER BY order_in_issue"
    )
    .all(issue.id) as ArticleListRow[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Past Issues", href: "/archive" },
          { label: `Vol. ${issue.volume}, No. ${issue.number}` },
        ]}
      />
      <h1 className="font-serif text-3xl font-bold text-primary-900">
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
    </div>
  );
}
