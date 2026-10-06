import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser, hasRole } from "@/lib/auth";

const VALID = ["invited", "accepted", "declined", "cancelled"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const db = getDb();
  const assignment = db
    .prepare("SELECT * FROM reviewer_assignments WHERE id = ?")
    .get(Number(id)) as
    | { id: number; manuscript_id: number; reviewer_user_id: number | null; reviewer_name: string; status: string }
    | undefined;
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isEditor = hasRole(user, "editor", "eic");
  const isTheReviewer = assignment.reviewer_user_id === user.id;
  if (!isEditor && !isTheReviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "");
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  // Reviewers may only accept or decline their own invitation
  if (!isEditor && !["accepted", "declined"].includes(status)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (assignment.status === "completed") {
    return NextResponse.json({ error: "Review already completed" }, { status: 400 });
  }

  db.prepare(
    "UPDATE reviewer_assignments SET status = ?, responded_at = datetime('now') WHERE id = ?"
  ).run(status, assignment.id);

  addEvent({
    manuscriptId: assignment.manuscript_id,
    actorUserId: user.id,
    type: "reviewer_responded",
    description: isTheReviewer
      ? `Reviewer ${status} the invitation`
      : `Editor set reviewer invitation to ${status}`,
    meta: { assignmentId: assignment.id },
    visibleToAuthor: false,
  });

  return NextResponse.json({ ok: true });
}
