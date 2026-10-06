import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser, hashPassword } from "@/lib/auth";
import crypto from "node:crypto";

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

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Reviewer name is required" }, { status: 400 });
  const email = String(body.email || "").trim();
  const affiliation = String(body.affiliation || "").trim();
  const source = body.source === "intuitionist" ? "intuitionist" : "manual";
  const dueDays = Math.min(Math.max(Number(body.dueDays) || 21, 3), 120);

  // Duplicate guard: same reviewer already active on this manuscript
  const dup = db
    .prepare(
      `SELECT id FROM reviewer_assignments
       WHERE manuscript_id = ? AND lower(reviewer_name) = lower(?) AND status IN ('invited','accepted','completed')`
    )
    .get(ms.id, name);
  if (dup) {
    return NextResponse.json(
      { error: `${name} is already assigned to this manuscript` },
      { status: 409 }
    );
  }

  // Link (or create) a reviewer user account so the reviewer portal works.
  let reviewerUserId: number | null = null;
  if (email) {
    const existing = db
      .prepare("SELECT id, roles FROM users WHERE email = ?")
      .get(email) as { id: number; roles: string } | undefined;
    if (existing) {
      reviewerUserId = existing.id;
      if (!existing.roles.split(",").includes("reviewer")) {
        db.prepare("UPDATE users SET roles = ? WHERE id = ?").run(
          `${existing.roles},reviewer`,
          existing.id
        );
      }
    } else {
      const tempPassword = crypto.randomBytes(12).toString("base64url");
      const info = db
        .prepare(
          `INSERT INTO users (email, password_hash, name, affiliation, roles)
           VALUES (?, ?, ?, ?, 'reviewer')`
        )
        .run(email, hashPassword(tempPassword), name, affiliation);
      reviewerUserId = Number(info.lastInsertRowid);
    }
  }

  const due = new Date(Date.now() + dueDays * 86_400_000).toISOString().slice(0, 10);
  db.prepare(
    `INSERT INTO reviewer_assignments
       (manuscript_id, reviewer_user_id, reviewer_name, reviewer_email, reviewer_affiliation,
        source, intuitionist_data, status, round, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'invited', ?, ?)`
  ).run(
    ms.id,
    reviewerUserId,
    name,
    email,
    affiliation,
    source,
    body.intuitionistData ? JSON.stringify(body.intuitionistData) : null,
    ms.round,
    due
  );

  // First reviewer invitation moves the manuscript into review
  if (["submitted", "revised"].includes(ms.status)) {
    db.prepare(
      "UPDATE manuscripts SET status = 'under_review', updated_at = datetime('now') WHERE id = ?"
    ).run(ms.id);
    addEvent({
      manuscriptId: ms.id,
      actorUserId: user.id,
      type: "status_change",
      description: "Manuscript moved to Under Review",
    });
  }

  addEvent({
    manuscriptId: ms.id,
    actorUserId: user.id,
    type: "reviewer_invited",
    description: `Reviewer invited (${source === "intuitionist" ? "AI-suggested" : "manual"}), due ${due}`,
    meta: { reviewer: name },
    visibleToAuthor: false,
  });
  addEvent({
    manuscriptId: ms.id,
    actorUserId: user.id,
    type: "reviewer_invited_public",
    description: "A reviewer was invited",
    visibleToAuthor: true,
  });

  return NextResponse.json({ ok: true });
}
