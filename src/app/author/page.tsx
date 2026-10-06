import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MS_STATUS_COLORS, MS_STATUS_LABELS, fmtDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageTitle, btnPrimary } from "@/components/ui";
import { FilePlus2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuthorDashboard() {
  const user = await requireUser();
  const db = getDb();

  const submissions = db
    .prepare(
      `SELECT m.*,
        (SELECT COUNT(*) FROM reviewer_assignments ra WHERE ra.manuscript_id = m.id AND ra.status IN ('invited','accepted','completed')) AS reviewer_count
       FROM manuscripts m
       WHERE m.corresponding_author_id = ?
       ORDER BY m.updated_at DESC`
    )
    .all(user.id) as {
    id: number;
    number: string | null;
    title: string;
    status: string;
    submitted_at: string | null;
    updated_at: string;
    created_at: string;
    reviewer_count: number;
  }[];

  const actionNeeded = submissions.filter((s) =>
    ["draft", "revision_requested"].includes(s.status)
  );

  return (
    <>
      <PageTitle
        title={`Welcome, ${user.name}`}
        subtitle="Track your manuscripts and start new submissions."
        actions={
          <Link href="/author/submit" className={btnPrimary}>
            <FilePlus2 className="h-4 w-4" aria-hidden="true" /> New Submission
          </Link>
        }
      />

      {actionNeeded.length > 0 && (
        <div className="mb-6 rounded-lg border border-accent-400 bg-accent-100/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent-700">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Action needed
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {actionNeeded.map((s) => (
              <li key={s.id}>
                <Link href={`/author/submissions/${s.id}`} className="font-medium text-primary-700 hover:underline">
                  {s.title || "Untitled draft"}
                </Link>
                {" — "}
                {s.status === "draft"
                  ? "complete and submit this draft"
                  : "a revision has been requested"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            hint="Start your first manuscript submission to JCEA."
            action={
              <Link href="/author/submit" className={btnPrimary}>
                Start a Submission
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Manuscript</th>
                  <th className="px-5 py-3">Number</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Reviewers</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="max-w-md px-5 py-3">
                      <Link
                        href={`/author/submissions/${s.id}`}
                        className="font-medium text-primary-800 hover:underline"
                      >
                        {s.title || "Untitled draft"}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{s.number || "—"}</td>
                    <td className="px-5 py-3">
                      <Badge className={MS_STATUS_COLORS[s.status] || ""}>
                        {MS_STATUS_LABELS[s.status] || s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {["under_review", "revised"].includes(s.status)
                        ? s.reviewer_count
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{fmtDate(s.submitted_at)}</td>
                    <td className="px-5 py-3 text-gray-600">{fmtDate(s.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
