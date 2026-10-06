import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin", "eic");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const asset = db
    .prepare("SELECT * FROM ai_assets WHERE id = ?")
    .get(Number(id)) as
    | { id: number; manuscript_id: number; type: string; status: string; article_id: number | null }
    | undefined;
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "approve") {
    if (asset.status !== "generated") {
      return NextResponse.json({ error: "Only generated assets can be approved" }, { status: 400 });
    }
    // Ensure the asset is linked to the published article record
    let articleId = asset.article_id;
    if (!articleId) {
      const article = db
        .prepare("SELECT id FROM articles WHERE manuscript_id = ?")
        .get(asset.manuscript_id) as { id: number } | undefined;
      articleId = article?.id ?? null;
    }
    db.prepare(
      "UPDATE ai_assets SET status = 'approved', article_id = ?, approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(articleId, user.id, asset.id);
    addEvent({
      manuscriptId: asset.manuscript_id,
      actorUserId: user.id,
      type: "ai_event",
      description: `AI ${asset.type} approved for publication`,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    db.prepare(
      "UPDATE ai_assets SET status = 'rejected', updated_at = datetime('now') WHERE id = ?"
    ).run(asset.id);
    addEvent({
      manuscriptId: asset.manuscript_id,
      actorUserId: user.id,
      type: "ai_event",
      description: `AI ${asset.type} rejected by editorial team`,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "unpublish") {
    if (asset.status !== "approved") {
      return NextResponse.json({ error: "Asset is not approved" }, { status: 400 });
    }
    db.prepare(
      "UPDATE ai_assets SET status = 'generated', updated_at = datetime('now') WHERE id = ?"
    ).run(asset.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
