import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { memberFields } from "../route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  const existing = db.prepare("SELECT id FROM board_members WHERE id = ?").get(Number(id));
  if (!existing) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const f = memberFields(body);
  if (!f.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  db.prepare(
    `UPDATE board_members SET name = ?, role = ?, affiliation = ?, country = ?, email = ?,
       research_areas = ?, bio = ?, sort_order = ?, active = ? WHERE id = ?`
  ).run(
    f.name, f.role, f.affiliation, f.country, f.email,
    f.research_areas, f.bio, f.sort_order, f.active, Number(id)
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  getDb().prepare("DELETE FROM board_members WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
