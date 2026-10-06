import { NextRequest, NextResponse } from "next/server";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";
import { getDb } from "@/lib/db";
import { hashPassword, createSession, type DbUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!EDITORIAL_SYSTEM_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { email, password, name, affiliation = "", country = "", orcid = "" } = body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, affiliation, country, orcid, roles)
       VALUES (?, ?, ?, ?, ?, ?, 'author')`
    )
    .run(email.trim(), hashPassword(password), name.trim(), affiliation, country, orcid);

  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(info.lastInsertRowid) as DbUser;
  await createSession(user);
  return NextResponse.json({ ok: true, redirect: "/author" });
}
