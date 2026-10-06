import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Badge, Card, CardHeader, PageTitle } from "@/components/ui";
import PublishIssueButton from "./PublishIssueButton";
import ArticleDoiEditor from "./ArticleDoiEditor";

import { api } from "@/lib/basePath";
export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  await requireUser("admin");
  const db = getDb();

  const issues = db
    .prepare("SELECT * FROM issues ORDER BY year DESC, volume DESC, number DESC")
    .all() as {
    id: number;
    volume: number;
    number: number;
    year: number;
    title: string;
    status: string;
    published_at: string | null;
  }[];

  const articles = db
    .prepare("SELECT * FROM articles ORDER BY issue_id, order_in_issue")
    .all() as {
    id: number;
    issue_id: number | null;
    title: string;
    authors_display: string;
    pages: string;
    doi: string;
    doi_status: string;
    koreascience_url: string;
    pdf_url: string;
    published_at: string | null;
  }[];

  return (
    <>
      <PageTitle
        title="Issues & DOI Registration"
        subtitle="Publish issues, track KoreaScience DOI registration, and export deposit metadata. PDFs stay hosted on KoreaScience — enter their URLs here."
      />
      <div className="space-y-6">
        {issues.map((i) => {
          const items = articles.filter((a) => a.issue_id === i.id);
          const doisReady = items.every((a) => a.doi_status === "registered");
          return (
            <Card key={i.id}>
              <CardHeader
                title={`Vol. ${i.volume}, No. ${i.number} (${i.year})${i.title ? ` — ${i.title}` : ""}`}
                subtitle={
                  i.status === "published"
                    ? `Published ${fmtDate(i.published_at)}`
                    : `${items.length} article${items.length === 1 ? "" : "s"} · ${
                        items.filter((a) => a.doi_status === "registered").length
                      } DOIs registered`
                }
                actions={
                  <div className="flex items-center gap-2">
                    <a
                      href={api(`/api/admin/issues/${i.id}/doi-export?format=json`)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Export JSON
                    </a>
                    <a
                      href={api(`/api/admin/issues/${i.id}/doi-export?format=xml`)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Export XML
                    </a>
                    {i.status !== "published" ? (
                      <PublishIssueButton issueId={i.id} articleCount={items.length} doisReady={doisReady} />
                    ) : (
                      <Badge className="bg-teal-100 text-teal-700">Published</Badge>
                    )}
                  </div>
                }
              />
              <ul className="divide-y divide-gray-100 px-5">
                {items.map((a) => (
                  <li key={a.id} className="py-4">
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.authors_display}</p>
                    <ArticleDoiEditor
                      article={{
                        id: a.id,
                        doi: a.doi,
                        doi_status: a.doi_status,
                        koreascience_url: a.koreascience_url,
                        pdf_url: a.pdf_url,
                        pages: a.pages,
                      }}
                    />
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="py-4 text-sm text-gray-500">
                    No articles assigned (assign accepted manuscripts in the Editorial Dashboard).
                  </li>
                )}
              </ul>
            </Card>
          );
        })}
        {issues.length === 0 && (
          <Card className="px-5 py-8 text-center text-sm text-gray-500">
            No issues yet — create one in the Editorial Dashboard → Issue Management.
          </Card>
        )}
      </div>
    </>
  );
}
