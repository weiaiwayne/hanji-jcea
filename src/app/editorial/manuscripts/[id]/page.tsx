import { getDb, parseJson } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  MS_STATUS_COLORS,
  MS_STATUS_LABELS,
  ASSIGNMENT_STATUS_LABELS,
  RECOMMENDATION_LABELS,
  fmtDate,
  fmtDateTime,
  daysUntil,
} from "@/lib/format";
import { Badge, Card, CardHeader, Breadcrumbs } from "@/components/ui";
import { notFound } from "next/navigation";
import ReviewerFinder from "./ReviewerFinder";
import DecisionForm from "./DecisionForm";
import EditorAssign from "./EditorAssign";
import AssignmentActions from "./AssignmentActions";

import { api } from "@/lib/basePath";
export const dynamic = "force-dynamic";

export default async function ManuscriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("editor", "eic");
  const { id } = await params;
  const db = getDb();

  const ms = db
    .prepare(
      `SELECT m.*, u.name AS author_account_name, u.email AS author_account_email,
              e.name AS editor_name
       FROM manuscripts m
       JOIN users u ON u.id = m.corresponding_author_id
       LEFT JOIN users e ON e.id = m.handling_editor_id
       WHERE m.id = ? AND m.status != 'draft'`
    )
    .get(Number(id)) as
    | {
        id: number;
        number: string;
        title: string;
        abstract: string;
        keywords: string;
        categories: string;
        cover_letter: string;
        recommended_reviewers: string;
        status: string;
        handling_editor_id: number | null;
        consent_podcast: number;
        consent_summary: number;
        consent_viz: number;
        checklist: string;
        funding: string;
        round: number;
        submitted_at: string;
        author_account_name: string;
        author_account_email: string;
        editor_name: string | null;
      }
    | undefined;
  if (!ms) notFound();

  const authors = db
    .prepare("SELECT * FROM manuscript_authors WHERE manuscript_id = ? ORDER BY position")
    .all(ms.id) as {
    id: number;
    name: string;
    email: string;
    affiliation: string;
    country: string;
    orcid: string;
    is_corresponding: number;
  }[];

  const files = db
    .prepare("SELECT * FROM manuscript_files WHERE manuscript_id = ? ORDER BY created_at")
    .all(ms.id) as { id: number; kind: string; filename: string; round: number; created_at: string }[];

  const assignments = db
    .prepare(
      `SELECT ra.*, r.recommendation, r.status AS review_status, r.id AS review_id,
              r.score_novelty, r.score_rigor, r.score_significance, r.score_clarity,
              r.comments_general, r.comments_sections, r.comments_confidential, r.submitted_at AS review_submitted_at
       FROM reviewer_assignments ra
       LEFT JOIN reviews r ON r.assignment_id = ra.id
       WHERE ra.manuscript_id = ?
       ORDER BY ra.invited_at DESC`
    )
    .all(ms.id) as {
    id: number;
    reviewer_name: string;
    reviewer_email: string;
    reviewer_affiliation: string;
    source: string;
    status: string;
    round: number;
    due_date: string | null;
    invited_at: string;
    recommendation: string | null;
    review_status: string | null;
    review_id: number | null;
    score_novelty: number | null;
    score_rigor: number | null;
    score_significance: number | null;
    score_clarity: number | null;
    comments_general: string | null;
    comments_sections: string | null;
    comments_confidential: string | null;
    review_submitted_at: string | null;
  }[];

  const decisions = db
    .prepare("SELECT d.*, u.name AS decider FROM decisions d LEFT JOIN users u ON u.id = d.decided_by WHERE d.manuscript_id = ? ORDER BY d.created_at DESC")
    .all(ms.id) as { id: number; round: number; decision: string; letter: string; decider: string; created_at: string }[];

  const events = db
    .prepare("SELECT * FROM editorial_events WHERE manuscript_id = ? ORDER BY created_at DESC LIMIT 30")
    .all(ms.id) as { id: number; type: string; description: string; created_at: string }[];

  const editors = db
    .prepare("SELECT id, name FROM users WHERE active = 1 AND (roles LIKE '%editor%' OR roles LIKE '%eic%' OR roles LIKE '%admin%') ORDER BY name")
    .all() as { id: number; name: string }[];

  const activeCount = assignments.filter((a) =>
    ["invited", "accepted", "completed"].includes(a.status)
  ).length;

  const keywords = parseJson<string[]>(ms.keywords, []);
  const categories = parseJson<string[]>(ms.categories, []);
  const recReviewers = parseJson<{ name: string; affiliation: string; email?: string; reason: string }[]>(
    ms.recommended_reviewers,
    []
  );
  const checklist = parseJson<Record<string, boolean>>(ms.checklist, {});

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Manuscript Queue", href: "/editorial" },
          { label: ms.number || `#${ms.id}` },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="max-w-3xl font-serif text-2xl font-bold text-primary-900">{ms.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {ms.number} · Submitted {fmtDate(ms.submitted_at)} · Round {ms.round} ·
            Corresponding: {ms.author_account_name} ({ms.author_account_email})
          </p>
        </div>
        <Badge className={`${MS_STATUS_COLORS[ms.status]} text-sm`}>
          {MS_STATUS_LABELS[ms.status] || ms.status}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Abstract & metadata" />
            <div className="px-5 py-4">
              <p className="prose-jcea text-sm">{ms.abstract}</p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-gray-700">Keywords</dt>
                  <dd className="text-gray-600">{keywords.join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Categories</dt>
                  <dd className="text-gray-600">{categories.join("; ") || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Funding</dt>
                  <dd className="text-gray-600">{ms.funding || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Checklist</dt>
                  <dd className="text-gray-600">
                    {["original", "plagiarism", "ethics", "funding"]
                      .filter((k) => checklist[k])
                      .join(", ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">AI consent</dt>
                  <dd className="text-gray-600">
                    {[
                      ms.consent_podcast ? "podcast" : null,
                      ms.consent_summary ? "summary" : null,
                      ms.consent_viz ? "visualizations" : null,
                    ]
                      .filter(Boolean)
                      .join(", ") || "none granted"}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Authors (unblinded)" />
            <ul className="divide-y divide-gray-100 px-5">
              {authors.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span>
                    <span className="font-medium text-gray-900">{a.name}</span>
                    <span className="text-gray-500"> — {a.affiliation}{a.country ? `, ${a.country}` : ""}</span>
                    {a.email && <span className="ml-2 text-xs text-gray-400">{a.email}</span>}
                  </span>
                  {a.is_corresponding === 1 && (
                    <Badge className="bg-primary-100 text-primary-700">Corresponding</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Cover letter & author-recommended reviewers" />
            <div className="px-5 py-4">
              <p className="prose-jcea whitespace-pre-line text-sm">{ms.cover_letter || "—"}</p>
              {recReviewers.length > 0 && (
                <div className="mt-4 rounded-md bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Author-recommended reviewers
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {recReviewers.map((r, i) => (
                      <li key={i}>
                        <span className="font-medium text-gray-900">{r.name}</span>
                        <span className="text-gray-500"> — {r.affiliation}</span>
                        {r.reason && <span className="block text-xs text-gray-500">{r.reason}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Reviewer assignment"
              subtitle={`${activeCount} reviewer${activeCount === 1 ? "" : "s"} assigned — JCEA requires a minimum of 2 per manuscript.`}
            />
            <div className="px-5 py-4">
              {activeCount < 2 && (
                <p className="mb-3 rounded-md bg-accent-100/70 px-3 py-2 text-sm text-accent-700">
                  Fewer than 2 active reviewers. Use the AI reviewer finder below or add reviewers manually.
                </p>
              )}
              <ul className="divide-y divide-gray-100">
                {assignments.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{a.reviewer_name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {a.reviewer_affiliation}
                          {a.source === "intuitionist" && " · AI-suggested"}
                          {a.round > 1 && ` · round ${a.round}`}
                        </span>
                        <p className="text-xs text-gray-500">
                          Invited {fmtDate(a.invited_at)}
                          {a.due_date &&
                            ` · due ${fmtDate(a.due_date)}${
                              a.status !== "completed" && (daysUntil(a.due_date) ?? 1) < 0
                                ? " (overdue)"
                                : ""
                            }`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            a.status === "completed"
                              ? "bg-teal-100 text-teal-700"
                              : a.status === "declined" || a.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : a.status === "accepted"
                                  ? "bg-primary-100 text-primary-700"
                                  : "bg-accent-100 text-accent-700"
                          }
                        >
                          {ASSIGNMENT_STATUS_LABELS[a.status] || a.status}
                        </Badge>
                        <AssignmentActions assignmentId={a.id} status={a.status} />
                      </div>
                    </div>
                    {a.review_status === "submitted" && (
                      <details className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
                        <summary className="cursor-pointer font-medium text-primary-800">
                          Review: {RECOMMENDATION_LABELS[a.recommendation || ""] || a.recommendation} ·
                          scores N{a.score_novelty}/R{a.score_rigor}/S{a.score_significance}/C{a.score_clarity} ·
                          {" "}{fmtDate(a.review_submitted_at)}
                        </summary>
                        <div className="mt-2 space-y-2 text-gray-700">
                          {a.comments_general && (
                            <div>
                              <p className="text-xs font-semibold uppercase text-gray-500">General comments</p>
                              <p className="whitespace-pre-line">{a.comments_general}</p>
                            </div>
                          )}
                          {a.comments_sections && (
                            <div>
                              <p className="text-xs font-semibold uppercase text-gray-500">Comments by section</p>
                              <p className="whitespace-pre-line">{a.comments_sections}</p>
                            </div>
                          )}
                          {a.comments_confidential && (
                            <div className="rounded bg-accent-100/60 p-2">
                              <p className="text-xs font-semibold uppercase text-accent-700">
                                Confidential to editor
                              </p>
                              <p className="whitespace-pre-line">{a.comments_confidential}</p>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </li>
                ))}
                {assignments.length === 0 && (
                  <li className="py-3 text-sm text-gray-500">No reviewers assigned yet.</li>
                )}
              </ul>
            </div>
          </Card>

          <ReviewerFinder
            manuscriptId={ms.id}
            defaultText={`${ms.title}\n\n${ms.abstract}`}
            authorNames={authors.map((a) => a.name)}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Handling editor" />
            <div className="px-5 py-4">
              <EditorAssign
                manuscriptId={ms.id}
                editors={editors}
                current={ms.handling_editor_id}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Files" />
            <ul className="divide-y divide-gray-100 px-5">
              {files.map((f) => (
                <li key={f.id} className="py-2.5 text-sm">
                  <a href={api(`/api/files/${f.id}`)} className="font-medium text-primary-700 hover:underline">
                    {f.filename}
                  </a>
                  <span className="ml-2 text-xs text-gray-500">
                    {f.kind}
                    {f.round > 1 ? ` · r${f.round}` : ""} · {fmtDate(f.created_at)}
                  </span>
                </li>
              ))}
              {files.length === 0 && <li className="py-3 text-sm text-gray-500">No files.</li>}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Record decision"
              subtitle={
                decisions.length > 0
                  ? `Last: ${RECOMMENDATION_LABELS[decisions[0].decision]} (round ${decisions[0].round})`
                  : "No decision recorded yet."
              }
            />
            <div className="px-5 py-4">
              <DecisionForm
                manuscriptId={ms.id}
                completedReviews={assignments.filter((a) => a.review_status === "submitted").length}
                status={ms.status}
              />
            </div>
          </Card>

          {decisions.length > 0 && (
            <Card>
              <CardHeader title="Decision log" />
              <ul className="divide-y divide-gray-100 px-5">
                {decisions.map((d) => (
                  <li key={d.id} className="py-3 text-sm">
                    <p className="font-medium text-gray-900">
                      Round {d.round}: {RECOMMENDATION_LABELS[d.decision] || d.decision}
                    </p>
                    <p className="text-xs text-gray-500">
                      {d.decider || "Unknown"} · {fmtDateTime(d.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title="Activity log" />
            <ol className="relative mx-5 my-4 max-h-96 space-y-4 overflow-y-auto border-l border-gray-200 pl-5">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary-400"
                  />
                  <p className="text-sm text-gray-800">{e.description}</p>
                  <p className="text-xs text-gray-500">{fmtDateTime(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
