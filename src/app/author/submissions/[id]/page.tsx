import { getDb, parseJson } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  MS_STATUS_COLORS,
  MS_STATUS_LABELS,
  RECOMMENDATION_LABELS,
  fmtDate,
  fmtDateTime,
} from "@/lib/format";
import { Badge, Card, CardHeader, Breadcrumbs } from "@/components/ui";
import { notFound } from "next/navigation";
import ConsentToggles from "./ConsentToggles";
import RevisionUpload from "./RevisionUpload";

import { api } from "@/lib/basePath";
export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();

  const ms = db
    .prepare("SELECT * FROM manuscripts WHERE id = ? AND corresponding_author_id = ?")
    .get(Number(id), user.id) as
    | {
        id: number;
        number: string | null;
        title: string;
        abstract: string;
        keywords: string;
        categories: string;
        cover_letter: string;
        recommended_reviewers: string;
        status: string;
        consent_podcast: number;
        consent_summary: number;
        consent_viz: number;
        funding: string;
        round: number;
        submitted_at: string | null;
      }
    | undefined;
  if (!ms) notFound();

  const authors = db
    .prepare("SELECT * FROM manuscript_authors WHERE manuscript_id = ? ORDER BY position")
    .all(ms.id) as { id: number; name: string; affiliation: string; is_corresponding: number }[];

  const files = db
    .prepare("SELECT * FROM manuscript_files WHERE manuscript_id = ? ORDER BY created_at")
    .all(ms.id) as { id: number; kind: string; filename: string; round: number; created_at: string }[];

  const events = db
    .prepare(
      "SELECT * FROM editorial_events WHERE manuscript_id = ? AND visible_to_author = 1 ORDER BY created_at DESC"
    )
    .all(ms.id) as { id: number; type: string; description: string; created_at: string }[];

  // Blinded reviewer progress: counts only, no identities
  const reviewStats = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status IN ('invited','accepted') THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
       FROM reviewer_assignments WHERE manuscript_id = ? AND status != 'cancelled'`
    )
    .get(ms.id) as { active: number | null; completed: number | null };

  const decisions = db
    .prepare("SELECT * FROM decisions WHERE manuscript_id = ? ORDER BY created_at DESC")
    .all(ms.id) as { id: number; round: number; decision: string; letter: string; created_at: string }[];

  const keywords = parseJson<string[]>(ms.keywords, []);
  const recReviewers = parseJson<{ name: string; affiliation: string; reason: string }[]>(
    ms.recommended_reviewers,
    []
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "My Submissions", href: "/author" },
          { label: ms.number || "Draft" },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="max-w-3xl font-serif text-2xl font-bold text-primary-900">
            {ms.title || "Untitled draft"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {ms.number ? `${ms.number} · ` : ""}Submitted {fmtDate(ms.submitted_at)} · Round {ms.round}
          </p>
        </div>
        <Badge className={`${MS_STATUS_COLORS[ms.status]} text-sm`}>
          {MS_STATUS_LABELS[ms.status] || ms.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {ms.status === "revision_requested" && (
            <Card className="border-accent-400">
              <CardHeader
                title="Revision requested"
                subtitle="Upload your revised manuscript and a response to reviewers."
              />
              <div className="px-5 py-4">
                <RevisionUpload manuscriptId={ms.id} />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Abstract" />
            <div className="px-5 py-4">
              <p className="prose-jcea">{ms.abstract || "—"}</p>
              {keywords.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {keywords.map((k) => (
                    <span key={k} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                      {k}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Authors" />
            <ul className="divide-y divide-gray-100 px-5">
              {authors.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    <span className="font-medium text-gray-900">{a.name}</span>
                    <span className="text-gray-500"> — {a.affiliation}</span>
                  </span>
                  {a.is_corresponding === 1 && (
                    <Badge className="bg-primary-100 text-primary-700">Corresponding</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Files" />
            <ul className="divide-y divide-gray-100 px-5">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    <a href={api(`/api/files/${f.id}`)} className="font-medium text-primary-700 hover:underline">
                      {f.filename}
                    </a>
                    <span className="ml-2 text-xs text-gray-500">
                      {f.kind}
                      {f.round > 1 ? ` · round ${f.round}` : ""}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">{fmtDate(f.created_at)}</span>
                </li>
              ))}
              {files.length === 0 && (
                <li className="py-3 text-sm text-gray-500">No files uploaded.</li>
              )}
            </ul>
          </Card>

          {decisions.length > 0 && (
            <Card>
              <CardHeader title="Editorial decisions" />
              <ul className="divide-y divide-gray-100 px-5">
                {decisions.map((d) => (
                  <li key={d.id} className="py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      Round {d.round}: {RECOMMENDATION_LABELS[d.decision] || d.decision}
                      <span className="ml-2 font-normal text-xs text-gray-500">
                        {fmtDate(d.created_at)}
                      </span>
                    </p>
                    {d.letter && (
                      <p className="prose-jcea mt-2 whitespace-pre-line text-sm">{d.letter}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Recommended reviewers"
              subtitle="Provided with your cover letter (for editorial reference)."
            />
            <ul className="divide-y divide-gray-100 px-5">
              {recReviewers.map((r, i) => (
                <li key={i} className="py-3 text-sm">
                  <span className="font-medium text-gray-900">{r.name}</span>
                  <span className="text-gray-500"> — {r.affiliation}</span>
                  {r.reason && <p className="text-xs text-gray-500">{r.reason}</p>}
                </li>
              ))}
              {recReviewers.length === 0 && (
                <li className="py-3 text-sm text-gray-500">None provided.</li>
              )}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Peer review status" subtitle="Reviewer identities are confidential (single-blind)." />
            <div className="px-5 py-4 text-sm text-gray-700">
              {ms.status === "draft" || ms.status === "submitted" ? (
                <p>
                  {ms.status === "draft"
                    ? "Not yet submitted."
                    : "Awaiting editorial assignment. You will be notified when review begins."}
                </p>
              ) : (
                <ul className="space-y-1">
                  <li>Reviews in progress: {reviewStats.active ?? 0}</li>
                  <li>Reviews completed: {reviewStats.completed ?? 0}</li>
                </ul>
              )}
            </div>
          </Card>

          <ConsentToggles
            manuscriptId={ms.id}
            initial={{
              podcast: ms.consent_podcast === 1,
              summary: ms.consent_summary === 1,
              viz: ms.consent_viz === 1,
            }}
          />

          <Card>
            <CardHeader title="Timeline" />
            <ol className="relative mx-5 my-4 space-y-4 border-l border-gray-200 pl-5">
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
              {events.length === 0 && (
                <li className="text-sm text-gray-500">No events yet.</li>
              )}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
