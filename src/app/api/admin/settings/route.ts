import { NextRequest, NextResponse } from "next/server";
import { setSetting } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string" && /^[a-z0-9_]+$/.test(key)) {
      setSetting(key, value);
    }
  }
  return NextResponse.json({ ok: true });
}
