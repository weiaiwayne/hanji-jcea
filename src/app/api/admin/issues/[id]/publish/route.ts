import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const issue = db
    .prepare("SELECT * FROM issues WHERE id = ?")
    .get(Number(id)) as { id: number; volume: number; number: number; status: string } | undefined;
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (issue.status === "published") {
    return NextResponse.json({ error: "Issue already published" }, { status: 400 });
  }
  const articles = db
    .prepare("SELECT id, manuscript_id FROM articles WHERE issue_id = ?")
    .all(issue.id) as { id: number; manuscript_id: number | null }[];
  if (articles.length === 0) {
    return NextResponse.json({ error: "Cannot publish an empty issue" }, { status: 400 });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE issues SET status = 'published', published_at = ? WHERE id = ?").run(
    now,
    issue.id
  );
  db.prepare(
    "UPDATE articles SET published_at = COALESCE(published_at, ?) WHERE issue_id = ?"
  ).run(now, issue.id);

  for (const a of articles) {
    if (a.manuscript_id) {
      db.prepare(
        "UPDATE manuscripts SET status = 'published', updated_at = datetime('now') WHERE id = ?"
      ).run(a.manuscript_id);
      addEvent({
        manuscriptId: a.manuscript_id,
        actorUserId: user.id,
        type: "published",
        description: `Published in Vol. ${issue.volume}, No. ${issue.number}`,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
