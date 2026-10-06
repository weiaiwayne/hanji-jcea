import { NextRequest, NextResponse } from "next/server";
import { getDb, getSetting } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { runGeneration } from "@/lib/ai/pipeline";

const CONSENT_COLUMN: Record<string, string> = {
  podcast: "consent_podcast",
  summary: "consent_summary",
  visualization: "consent_viz",
};

export async function POST(req: NextRequest) {
  const user = await apiUser("admin", "eic");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (getSetting("ai_features_enabled", "yes").toLowerCase() === "no") {
    return NextResponse.json(
      { error: "AI features are disabled globally (see Site Settings)" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "");
  if (!CONSENT_COLUMN[type]) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  const db = getDb();
  const ms = db
    .prepare("SELECT * FROM manuscripts WHERE id = ?")
    .get(Number(body.manuscriptId)) as
    | ({ id: number; status: string } & Record<string, unknown>)
    | undefined;
  if (!ms) return NextResponse.json({ error: "Manuscript not found" }, { status: 404 });
  if (!["accepted", "published"].includes(ms.status)) {
    return NextResponse.json(
      { error: "AI content can only be generated for accepted or published manuscripts" },
      { status: 400 }
    );
  }
  if (ms[CONSENT_COLUMN[type]] !== 1) {
    return NextResponse.json(
      { error: "The author has not consented to this AI feature" },
      { status: 400 }
    );
  }

  const article = db
    .prepare("SELECT id FROM articles WHERE manuscript_id = ?")
    .get(ms.id) as { id: number } | undefined;

  const existing = db
    .prepare("SELECT * FROM ai_assets WHERE manuscript_id = ? AND type = ?")
    .get(ms.id, type) as { id: number; status: string } | undefined;

  let assetId: number;
  if (existing) {
    if (["generating"].includes(existing.status)) {
      return NextResponse.json({ error: "Generation is already running" }, { status: 409 });
    }
    if (existing.status === "approved" && !body.force) {
      return NextResponse.json(
        { error: "An approved asset already exists — regenerating will require re-approval. Retry with force." },
        { status: 409 }
      );
    }
    db.prepare(
      "UPDATE ai_assets SET status = 'pending', error = NULL, article_id = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(article?.id ?? null, existing.id);
    assetId = existing.id;
  } else {
    const info = db
      .prepare(
        "INSERT INTO ai_assets (manuscript_id, article_id, type, status, created_by) VALUES (?, ?, ?, 'pending', ?)"
      )
      .run(ms.id, article?.id ?? null, type, user.id);
    assetId = Number(info.lastInsertRowid);
  }

  // Fire and forget — generation can take minutes (Ollama + TTS).
  void runGeneration(assetId);

  return NextResponse.json({ ok: true, assetId, status: "generating" });
}
