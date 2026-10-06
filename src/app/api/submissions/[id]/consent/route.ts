import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const db = getDb();
  const ms = db
    .prepare("SELECT id, corresponding_author_id FROM manuscripts WHERE id = ?")
    .get(Number(id)) as { id: number; corresponding_author_id: number } | undefined;
  if (!ms || ms.corresponding_author_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  db.prepare(
    `UPDATE manuscripts SET consent_podcast = ?, consent_summary = ?, consent_viz = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(body.podcast ? 1 : 0, body.summary ? 1 : 0, body.viz ? 1 : 0, ms.id);

  addEvent({
    manuscriptId: ms.id,
    actorUserId: user.id,
    type: "ai_event",
    description: `Author updated AI consent (podcast: ${body.podcast ? "yes" : "no"}, summary: ${body.summary ? "yes" : "no"}, visualizations: ${body.viz ? "yes" : "no"})`,
    visibleToAuthor: true,
  });
  return NextResponse.json({ ok: true });
}
