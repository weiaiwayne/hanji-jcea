import { NextRequest, NextResponse } from "next/server";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";
import { getDb } from "@/lib/db";
import { verifyPassword, createSession, type DbUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!EDITORIAL_SYSTEM_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  const user = getDb()
    .prepare("SELECT * FROM users WHERE email = ? AND active = 1")
    .get(body.email) as DbUser | undefined;
  if (!user || !verifyPassword(body.password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  await createSession(user);

  const roles = user.roles.split(",");
  const redirect = roles.includes("admin")
    ? "/admin"
    : roles.includes("editor") || roles.includes("eic")
      ? "/editorial"
      : roles.includes("reviewer")
        ? "/reviewer"
        : "/author";
  return NextResponse.json({ ok: true, redirect });
}
