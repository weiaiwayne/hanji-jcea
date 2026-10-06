import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Badge, Card, CardHeader, PageTitle } from "@/components/ui";
import IssueCreateForm from "./IssueCreateForm";
import AssignToIssue from "./AssignToIssue";

export const dynamic = "force-dynamic";

export default async function EditorialIssuesPage() {
  await requireUser("editor", "eic");
  const db = getDb();

  const issues = db
    .prepare(
      `SELECT i.*, COUNT(a.id) AS article_count FROM issues i
       LEFT JOIN articles a ON a.issue_id = i.id
       GROUP BY i.id ORDER BY i.year DESC, i.volume DESC, i.number DESC`
    )
    .all() as {
    id: number;
    volume: number;
    number: number;
    year: number;
    title: string;
    status: string;
    published_at: string | null;
    article_count: number;
  }[];

  const unassigned = db
    .prepare(
      `SELECT m.id, m.number, m.title FROM manuscripts m
       WHERE m.status = 'accepted'
         AND NOT EXISTS (SELECT 1 FROM articles a WHERE a.manuscript_id = m.id)
       ORDER BY m.updated_at`
    )
    .all() as { id: number; number: string; title: string }[];

  const issueArticles = db
    .prepare(
      `SELECT a.id, a.title, a.authors_display, a.issue_id, a.doi, a.doi_status
       FROM articles a WHERE a.issue_id IS NOT NULL ORDER BY a.order_in_issue`
    )
    .all() as {
    id: number;
    title: string;
    authors_display: string;
    issue_id: number;
    doi: string;
    doi_status: string;
  }[];

  const openIssues = issues.filter((i) => i.status !== "published");

  return (
    <>
      <PageTitle
        title="Issue Management"
        subtitle="Assign accepted manuscripts to upcoming issues. Publication and DOI registration are handled in the Admin CMS."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Accepted manuscripts awaiting issue assignment"
              subtitle={`${unassigned.length} manuscript${unassigned.length === 1 ? "" : "s"}`}
            />
            <ul className="divide-y divide-gray-100 px-5">
              {unassigned.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-sm">
                    <span className="font-medium text-gray-900">{m.title}</span>
                    <span className="ml-2 text-xs text-gray-500">{m.number}</span>
                  </span>
                  <AssignToIssue
                    manuscriptId={m.id}
                    issues={openIssues.map((i) => ({
                      id: i.id,
                      label: `Vol. ${i.volume}, No. ${i.number} (${i.year})`,
                    }))}
                  />
                </li>
              ))}
              {unassigned.length === 0 && (
                <li className="py-4 text-sm text-gray-500">
                  No accepted manuscripts are waiting for an issue.
                </li>
              )}
            </ul>
          </Card>

          {issues.map((i) => (
            <Card key={i.id}>
              <CardHeader
                title={`Vol. ${i.volume}, No. ${i.number} (${i.year})${i.title ? ` — ${i.title}` : ""}`}
                subtitle={
                  i.status === "published"
                    ? `Published ${fmtDate(i.published_at)}`
                    : `${i.article_count} article${i.article_count === 1 ? "" : "s"} assigned`
                }
                actions={
                  <Badge
                    className={
                      i.status === "published"
                        ? "bg-teal-100 text-teal-700"
                        : i.status === "in_progress"
                          ? "bg-primary-100 text-primary-700"
                          : "bg-gray-100 text-gray-600"
                    }
                  >
                    {i.status.replace("_", " ")}
                  </Badge>
                }
              />
              <ul className="divide-y divide-gray-100 px-5">
                {issueArticles
                  .filter((a) => a.issue_id === i.id)
                  .map((a) => (
                    <li key={a.id} className="py-2.5 text-sm">
                      <span className="font-medium text-gray-900">{a.title}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {a.authors_display}
                        {a.doi ? ` · doi:${a.doi}` : ` · DOI ${a.doi_status}`}
                      </span>
                    </li>
                  ))}
                {issueArticles.filter((a) => a.issue_id === i.id).length === 0 && (
                  <li className="py-3 text-sm text-gray-500">No articles assigned yet.</li>
                )}
              </ul>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader title="Create a new issue" />
            <div className="px-5 py-4">
              <IssueCreateForm />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
