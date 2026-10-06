import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { saveUpload } from "@/lib/files";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("reviewer");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const assignment = db
    .prepare(
      "SELECT * FROM reviewer_assignments WHERE id = ? AND reviewer_user_id = ?"
    )
    .get(Number(id), user.id) as
    | { id: number; manuscript_id: number; status: string; round: number }
    | undefined;
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assignment.status !== "accepted") {
    return NextResponse.json(
      { error: "This review is not open (accept the invitation first)" },
      { status: 400 }
    );
  }

  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  let payload: {
    submit?: boolean;
    recommendation?: string;
    comments_general?: string;
    comments_sections?: string;
    comments_confidential?: string;
    score_novelty?: number;
    score_rigor?: number;
    score_significance?: number;
    score_clarity?: number;
    conflict_declared?: boolean;
  };
  try {
    payload = JSON.parse(String(fd.get("payload") || "{}"));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const isSubmit = !!payload.submit;
  if (isSubmit) {
    if (!payload.conflict_declared) {
      return NextResponse.json(
        { error: "The conflict-of-interest declaration is required" },
        { status: 400 }
      );
    }
    if (!["accept", "minor_revision", "major_revision", "reject"].includes(payload.recommendation || "")) {
      return NextResponse.json({ error: "A recommendation is required" }, { status: 400 });
    }
    const scores = [
      payload.score_novelty,
      payload.score_rigor,
      payload.score_significance,
      payload.score_clarity,
    ];
    if (scores.some((s) => !s || s < 1 || s > 5)) {
      return NextResponse.json({ error: "All quality scores (1–5) are required" }, { status: 400 });
    }
  }

  let fileId: number | null = null;
  const attachment = fd.get("attachment");
  if (attachment instanceof File && attachment.size > 0) {
    fileId = await saveUpload({
      manuscriptId: assignment.manuscript_id,
      file: attachment,
      kind: "review_attachment",
      round: assignment.round,
      uploadedBy: user.id,
    });
  }

  const existing = db
    .prepare("SELECT id, file_id FROM reviews WHERE assignment_id = ?")
    .get(assignment.id) as { id: number; file_id: number | null } | undefined;

  const fields = {
    recommendation: payload.recommendation || null,
    comments_general: payload.comments_general || "",
    comments_sections: payload.comments_sections || "",
    comments_confidential: payload.comments_confidential || "",
    score_novelty: payload.score_novelty || null,
    score_rigor: payload.score_rigor || null,
    score_significance: payload.score_significance || null,
    score_clarity: payload.score_clarity || null,
    conflict_declared: payload.conflict_declared ? 1 : 0,
    status: isSubmit ? "submitted" : "in_progress",
    submitted_at: isSubmit ? new Date().toISOString() : null,
  };

  if (existing) {
    db.prepare(
      `UPDATE reviews SET recommendation = ?, comments_general = ?, comments_sections = ?,
         comments_confidential = ?, score_novelty = ?, score_rigor = ?, score_significance = ?,
         score_clarity = ?, conflict_declared = ?, status = ?, submitted_at = COALESCE(?, submitted_at),
         file_id = COALESCE(?, file_id), updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      fields.recommendation,
      fields.comments_general,
      fields.comments_sections,
      fields.comments_confidential,
      fields.score_novelty,
      fields.score_rigor,
      fields.score_significance,
      fields.score_clarity,
      fields.conflict_declared,
      fields.status,
      fields.submitted_at,
      fileId,
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO reviews (assignment_id, manuscript_id, round, recommendation, comments_general,
         comments_sections, comments_confidential, score_novelty, score_rigor, score_significance,
         score_clarity, conflict_declared, file_id, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      assignment.id,
      assignment.manuscript_id,
      assignment.round,
      fields.recommendation,
      fields.comments_general,
      fields.comments_sections,
      fields.comments_confidential,
      fields.score_novelty,
      fields.score_rigor,
      fields.score_significance,
      fields.score_clarity,
      fields.conflict_declared,
      fileId,
      fields.status,
      fields.submitted_at
    );
  }

  if (isSubmit) {
    db.prepare(
      "UPDATE reviewer_assignments SET status = 'completed', completed_at = datetime('now') WHERE id = ?"
    ).run(assignment.id);
    addEvent({
      manuscriptId: assignment.manuscript_id,
      actorUserId: user.id,
      type: "review_submitted",
      description: "A peer review was submitted",
      visibleToAuthor: true,
    });
  }

  return NextResponse.json({ ok: true });
}
