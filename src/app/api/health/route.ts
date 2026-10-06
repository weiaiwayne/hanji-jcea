import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { intuitionistHealth } from "@/lib/intuitionist";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  try {
    const row = getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    checks.database = { ok: true, detail: `${row.n} users` };
  } catch (e) {
    checks.database = { ok: false, detail: String(e) };
  }

  checks.intuitionist = await intuitionistHealth();

  try {
    const res = await fetch(
      (process.env.OLLAMA_URL || "http://localhost:11434") + "/api/tags",
      { signal: AbortSignal.timeout(3000) }
    );
    checks.ollama = { ok: res.ok, detail: res.ok ? "reachable" : `status ${res.status}` };
  } catch (e) {
    checks.ollama = { ok: false, detail: String(e) };
  }

  const ok = checks.database.ok && checks.intuitionist.ok;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "jcea-editorial-system",
      time: new Date().toISOString(),
      // Public endpoint: report up/down only, never counts or error text
      checks: Object.fromEntries(
        Object.entries(checks).map(([k, v]) => [k, { ok: v.ok }])
      ),
    },
    { status: ok ? 200 : 503 }
  );
}
