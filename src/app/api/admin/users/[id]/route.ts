import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { apiUser, hashPassword } from "@/lib/auth";

const ALL_ROLES = ["author", "reviewer", "editor", "eic", "admin"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await apiUser("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const userId = Number(id);

  const db = getDb();
  const target = db
    .prepare("SELECT id, roles FROM users WHERE id = ?")
    .get(userId) as { id: number; roles: string } | undefined;
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  if (Array.isArray(body.roles)) {
    const roles = body.roles.filter((r: string) => ALL_ROLES.includes(r));
    if (roles.length === 0) {
      return NextResponse.json({ error: "At least one valid role is required" }, { status: 400 });
    }
    if (userId === me.id && !roles.includes("admin")) {
      return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
    }
    db.prepare("UPDATE users SET roles = ? WHERE id = ?").run(roles.join(","), userId);
  }

  if (body.resetPassword) {
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      hashPassword(tempPassword),
      userId
    );
    return NextResponse.json({ ok: true, tempPassword });
  }

  if (typeof body.active === "boolean") {
    if (userId === me.id && !body.active) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }
    db.prepare("UPDATE users SET active = ? WHERE id = ?").run(body.active ? 1 : 0, userId);
  }

  return NextResponse.json({ ok: true });
}
