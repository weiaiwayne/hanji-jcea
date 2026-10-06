import { NextRequest, NextResponse } from "next/server";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";
import { getDb, getSetting } from "@/lib/db";
import { createSession, type DbUser } from "@/lib/auth";

/**
 * Demo mode: one-click sign-in to a pre-seeded demo persona so visitors can
 * experience the submission, reviewer-selection, and review flows without
 * registering. Disabled by setting demo_mode=no in Site Settings (the
 * production configuration).
 */
const DEMO_ACCOUNTS: Record<string, { email: string; redirect: string }> = {
  author: { email: "author@jcea.demo", redirect: "/author" },
  editor: { email: "eic@jcea.demo", redirect: "/editorial" },
  reviewer: { email: "reviewer2@jcea.demo", redirect: "/reviewer" },
  admin: { email: "admin@jcea.demo", redirect: "/admin" },
};

export async function POST(req: NextRequest) {
  if (!EDITORIAL_SYSTEM_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (getSetting("demo_mode", "yes").toLowerCase() === "no") {
    return NextResponse.json(
      { error: "Demo mode is disabled on this installation" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const target = DEMO_ACCOUNTS[String(body.role || "")];
  if (!target) {
    return NextResponse.json({ error: "Unknown demo role" }, { status: 400 });
  }
  const user = getDb()
    .prepare("SELECT * FROM users WHERE email = ? AND active = 1")
    .get(target.email) as DbUser | undefined;
  if (!user) {
    return NextResponse.json(
      { error: "Demo account not found — has the database been seeded?" },
      { status: 500 }
    );
  }
  await createSession(user);
  return NextResponse.json({ ok: true, redirect: target.redirect });
}
