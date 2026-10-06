import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser, hasRole } from "@/lib/auth";
import { getFileRow, readFileBytes } from "@/lib/files";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const row = getFileRow(Number(id));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Access: editors/admins always; the corresponding author; assigned reviewers.
  let allowed = hasRole(user, "editor", "eic", "admin");
  if (!allowed) {
    const ms = getDb()
      .prepare("SELECT corresponding_author_id FROM manuscripts WHERE id = ?")
      .get(row.manuscript_id) as { corresponding_author_id: number } | undefined;
    allowed = ms?.corresponding_author_id === user.id;
  }
  if (!allowed) {
    const assignment = getDb()
      .prepare(
        "SELECT id FROM reviewer_assignments WHERE manuscript_id = ? AND reviewer_user_id = ? AND status IN ('invited','accepted','completed')"
      )
      .get(row.manuscript_id, user.id);
    allowed = !!assignment;
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bytes = readFileBytes(row);
  if (!bytes) return NextResponse.json({ error: "File missing on disk" }, { status: 410 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.mime || "application/octet-stream",
      "Content-Disposition": `inline; filename="${row.filename.replace(/"/g, "")}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
