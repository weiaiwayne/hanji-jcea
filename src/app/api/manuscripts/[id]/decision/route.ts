import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { RECOMMENDATION_LABELS } from "@/lib/format";

const DECISION_STATUS: Record<string, string> = {
  accept: "accepted",
  minor_revision: "revision_requested",
  major_revision: "revision_requested",
  reject: "rejected",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("editor", "eic");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const ms = db
    .prepare("SELECT id, number, status, round FROM manuscripts WHERE id = ?")
    .get(Number(id)) as
    | { id: number; number: string; status: string; round: number }
    | undefined;
  if (!ms) return NextResponse.json({ error: "Manuscript not found" }, { status: 404 });
  if (["accepted", "rejected", "published", "withdrawn"].includes(ms.status)) {
    return NextResponse.json(
      { error: `Manuscript is already ${ms.status}` },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const decision = String(body.decision || "");
  if (!DECISION_STATUS[decision]) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }
  const letter = String(body.letter || "");

  db.prepare(
    "INSERT INTO decisions (manuscript_id, round, decision, letter, decided_by) VALUES (?, ?, ?, ?, ?)"
  ).run(ms.id, ms.round, decision, letter, user.id);
  db.prepare(
    "UPDATE manuscripts SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(DECISION_STATUS[decision], ms.id);

  // Open review assignments are closed out when a decision is recorded
  db.prepare(
    "UPDATE reviewer_assignments SET status = 'cancelled' WHERE manuscript_id = ? AND status = 'invited'"
  ).run(ms.id);

  addEvent({
    manuscriptId: ms.id,
    actorUserId: user.id,
    type: "decision",
    description: `Editorial decision (round ${ms.round}): ${RECOMMENDATION_LABELS[decision]}`,
    meta: { decision },
  });

  return NextResponse.json({ ok: true, status: DECISION_STATUS[decision] });
}
