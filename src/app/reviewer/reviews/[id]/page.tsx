import { getDb, parseJson } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Card, CardHeader, Breadcrumbs, Badge } from "@/components/ui";
import { notFound } from "next/navigation";
import ReviewForm from "./ReviewForm";

import { api } from "@/lib/basePath";
export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("reviewer");
  const { id } = await params;
  const db = getDb();

  const assignment = db
    .prepare(
      `SELECT ra.*, m.title, m.abstract, m.keywords, m.number AS ms_number, m.id AS ms_id
       FROM reviewer_assignments ra
       JOIN manuscripts m ON m.id = ra.manuscript_id
       WHERE ra.id = ? AND ra.reviewer_user_id = ?`
    )
    .get(Number(id), user.id) as
    | {
        id: number;
        status: string;
        due_date: string | null;
        round: number;
        title: string;
        abstract: string;
        keywords: string;
        ms_number: string;
        ms_id: number;
      }
    | undefined;
  if (!assignment || !["accepted", "completed"].includes(assignment.status)) notFound();

  // Reviewers see manuscript + supplementary files, never other reviews
  const files = db
    .prepare(
      `SELECT id, kind, filename, round FROM manuscript_files
       WHERE manuscript_id = ? AND kind IN ('manuscript','supplementary','revision')
       ORDER BY created_at`
    )
    .all(assignment.ms_id) as { id: number; kind: string; filename: string; round: number }[];

  const review = db
    .prepare("SELECT * FROM reviews WHERE assignment_id = ?")
    .get(assignment.id) as
    | {
        id: number;
        recommendation: string | null;
        comments_general: string;
        comments_sections: string;
        comments_confidential: string;
        score_novelty: number | null;
        score_rigor: number | null;
        score_significance: number | null;
        score_clarity: number | null;
        conflict_declared: number;
        status: string;
      }
    | undefined;

  const submitted = review?.status === "submitted";

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "My Reviews", href: "/reviewer" },
          { label: assignment.ms_number },
        ]}
      />
      <div className="mb-6">
        <h1 className="max-w-3xl font-serif text-2xl font-bold text-primary-900">
          {assignment.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {assignment.ms_number} · Round {assignment.round}
          {assignment.due_date && ` · Review due ${fmtDate(assignment.due_date)}`}
        </p>
        {submitted && (
          <Badge className="mt-2 bg-teal-100 text-teal-700">Review submitted — thank you</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <ReviewForm
            assignmentId={assignment.id}
            initial={{
              recommendation: review?.recommendation || "",
              comments_general: review?.comments_general || "",
              comments_sections: review?.comments_sections || "",
              comments_confidential: review?.comments_confidential || "",
              score_novelty: review?.score_novelty || 0,
              score_rigor: review?.score_rigor || 0,
              score_significance: review?.score_significance || 0,
              score_clarity: review?.score_clarity || 0,
              conflict_declared: review?.conflict_declared === 1,
            }}
            readOnly={submitted}
          />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Abstract" />
            <div className="px-5 py-4">
              <p className="prose-jcea text-sm">{assignment.abstract}</p>
              <p className="mt-3 flex flex-wrap gap-1.5">
                {parseJson<string[]>(assignment.keywords, []).map((k) => (
                  <span key={k} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                    {k}
                  </span>
                ))}
              </p>
            </div>
          </Card>
          <Card>
            <CardHeader title="Manuscript files" />
            <ul className="divide-y divide-gray-100 px-5">
              {files.map((f) => (
                <li key={f.id} className="py-2.5 text-sm">
                  <a href={api(`/api/files/${f.id}`)} className="font-medium text-primary-700 hover:underline">
                    {f.filename}
                  </a>
                  <span className="ml-2 text-xs text-gray-500">
                    {f.kind}
                    {f.round > 1 ? ` · r${f.round}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
