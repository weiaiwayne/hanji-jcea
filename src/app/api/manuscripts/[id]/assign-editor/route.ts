import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("editor", "eic");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const ms = db.prepare("SELECT id FROM manuscripts WHERE id = ?").get(Number(id));
  if (!ms) return NextResponse.json({ error: "Manuscript not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const editorId = body.editorId ? Number(body.editorId) : null;
  let editorName = "unassigned";
  if (editorId) {
    const editor = db
      .prepare("SELECT id, name FROM users WHERE id = ? AND active = 1")
      .get(editorId) as { id: number; name: string } | undefined;
    if (!editor) return NextResponse.json({ error: "Editor not found" }, { status: 404 });
    editorName = editor.name;
  }

  db.prepare(
    "UPDATE manuscripts SET handling_editor_id = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(editorId, Number(id));

  addEvent({
    manuscriptId: Number(id),
    actorUserId: user.id,
    type: "editor_assigned",
    description: editorId ? `Handling editor assigned: ${editorName}` : "Handling editor unassigned",
    visibleToAuthor: false,
  });
  return NextResponse.json({ ok: true });
}
