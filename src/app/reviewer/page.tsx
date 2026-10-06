import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, daysUntil } from "@/lib/format";
import { Badge, Card, EmptyState, PageTitle } from "@/components/ui";
import InvitationActions from "./InvitationActions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  invited: { label: "Invitation pending", cls: "bg-accent-100 text-accent-700" },
  accepted: { label: "In progress", cls: "bg-primary-100 text-primary-700" },
  completed: { label: "Submitted", cls: "bg-teal-100 text-teal-700" },
  declined: { label: "Declined", cls: "bg-gray-100 text-gray-500" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500" },
};

export default async function ReviewerDashboard() {
  const user = await requireUser("reviewer");
  const db = getDb();

  const assignments = db
    .prepare(
      `SELECT ra.*, m.title, m.abstract, m.number AS ms_number,
              r.status AS review_status
       FROM reviewer_assignments ra
       JOIN manuscripts m ON m.id = ra.manuscript_id
       LEFT JOIN reviews r ON r.assignment_id = ra.id
       WHERE ra.reviewer_user_id = ?
       ORDER BY CASE ra.status
                  WHEN 'invited' THEN 0
                  WHEN 'accepted' THEN 1
                  WHEN 'completed' THEN 2
                  ELSE 3
                END, ra.due_date`
    )
    .all(user.id) as {
    id: number;
    status: string;
    due_date: string | null;
    invited_at: string;
    round: number;
    title: string;
    ms_number: string;
    review_status: string | null;
  }[];

  return (
    <>
      <PageTitle
        title="Assigned Reviews"
        subtitle="Manuscripts are single-blind: you can see author names, but authors never see yours."
      />
      {assignments.length === 0 ? (
        <Card>
          <EmptyState
            title="No review assignments"
            hint="When an editor invites you to review, the manuscript will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const due = daysUntil(a.due_date);
            const badge = STATUS_BADGE[a.status] || { label: a.status, cls: "" };
            return (
              <Card key={a.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">
                      {a.ms_number} · Invited {fmtDate(a.invited_at)} · Round {a.round}
                    </p>
                    <h2 className="mt-0.5 font-serif text-lg font-semibold text-primary-900">
                      {["accepted", "completed"].includes(a.status) ? (
                        <Link href={`/reviewer/reviews/${a.id}`} className="hover:underline">
                          {a.title}
                        </Link>
                      ) : (
                        a.title
                      )}
                    </h2>
                    {a.due_date && a.status !== "completed" && (
                      <p
                        className={`mt-1 text-sm ${
                          due !== null && due < 0
                            ? "font-semibold text-red-600"
                            : due !== null && due <= 5
                              ? "font-medium text-accent-700"
                              : "text-gray-600"
                        }`}
                      >
                        Due {fmtDate(a.due_date)}
                        {due !== null &&
                          (due < 0 ? ` — ${-due} days overdue` : ` — ${due} days left`)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={badge.cls}>{badge.label}</Badge>
                    {a.status === "invited" && <InvitationActions assignmentId={a.id} />}
                    {a.status === "accepted" && (
                      <Link
                        href={`/reviewer/reviews/${a.id}`}
                        className="rounded-md bg-primary-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600"
                      >
                        {a.review_status === "in_progress" ? "Continue review" : "Start review"}
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
