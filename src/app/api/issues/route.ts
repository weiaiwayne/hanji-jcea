import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await apiUser("editor", "eic", "admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const volume = Number(body.volume);
  const number = Number(body.number);
  const year = Number(body.year);
  if (!volume || !number || !year) {
    return NextResponse.json({ error: "Volume, number, and year are required" }, { status: 400 });
  }
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM issues WHERE volume = ? AND number = ?")
    .get(volume, number);
  if (existing) {
    return NextResponse.json(
      { error: `Volume ${volume}, Number ${number} already exists` },
      { status: 409 }
    );
  }
  const info = db
    .prepare("INSERT INTO issues (volume, number, year, title, status) VALUES (?, ?, ?, ?, 'in_progress')")
    .run(volume, number, year, String(body.title || ""));
  return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
}
