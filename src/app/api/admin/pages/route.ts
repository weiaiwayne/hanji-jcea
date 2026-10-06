import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { title, slug, html = "" } = body;
  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }
  const db = getDb();
  const existing = db.prepare("SELECT id FROM cms_pages WHERE slug = ?").get(slug);
  if (existing) {
    return NextResponse.json({ error: "A page with this slug already exists" }, { status: 409 });
  }
  const info = db
    .prepare(
      "INSERT INTO cms_pages (slug, title, html, updated_by, updated_at) VALUES (?, ?, ?, ?, datetime('now'))"
    )
    .run(slug, title, html, user.id);
  return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
}
