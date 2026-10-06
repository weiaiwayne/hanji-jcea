import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const page = db.prepare("SELECT id FROM cms_pages WHERE id = ?").get(Number(id));
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { title, slug, html = "" } = body;
  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }
  const clash = db
    .prepare("SELECT id FROM cms_pages WHERE slug = ? AND id != ?")
    .get(slug, Number(id));
  if (clash) {
    return NextResponse.json({ error: "Another page already uses this slug" }, { status: 409 });
  }
  db.prepare(
    "UPDATE cms_pages SET title = ?, slug = ?, html = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title, slug, html, user.id, Number(id));
  return NextResponse.json({ ok: true });
}
