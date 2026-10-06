import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export function memberFields(body: Record<string, unknown>) {
  return {
    name: String(body.name || "").trim(),
    role: String(body.role || "Editorial Board"),
    affiliation: String(body.affiliation || ""),
    country: String(body.country || ""),
    email: String(body.email || ""),
    research_areas: JSON.stringify(
      String(body.research_areas || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
    bio: String(body.bio || ""),
    sort_order: Number(body.sort_order) || 100,
    active: body.active ? 1 : 0,
  };
}

export async function POST(req: NextRequest) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const f = memberFields(body);
  if (!f.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const info = getDb()
    .prepare(
      `INSERT INTO board_members (name, role, affiliation, country, email, research_areas, bio, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(f.name, f.role, f.affiliation, f.country, f.email, f.research_areas, f.bio, f.sort_order, f.active);
  return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
}
