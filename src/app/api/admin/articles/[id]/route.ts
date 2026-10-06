import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { buildDoiMetadata, getDoiArticle } from "@/lib/koreascience";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const article = db.prepare("SELECT id FROM articles WHERE id = ?").get(Number(id));
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const doiStatus = ["none", "prepared", "registered"].includes(body.doi_status)
    ? body.doi_status
    : "none";

  db.prepare(
    `UPDATE articles SET doi = ?, doi_status = ?, koreascience_url = ?, pdf_url = ?, pages = ? WHERE id = ?`
  ).run(
    String(body.doi || "").trim(),
    doiStatus,
    String(body.koreascience_url || "").trim(),
    String(body.pdf_url || "").trim(),
    String(body.pages || "").trim(),
    Number(id)
  );

  // Refresh the stored deposit metadata snapshot whenever the record changes
  const full = getDoiArticle(Number(id));
  if (full) {
    db.prepare("UPDATE articles SET doi_metadata = ? WHERE id = ?").run(
      JSON.stringify(buildDoiMetadata(full)),
      Number(id)
    );
  }
  return NextResponse.json({ ok: true });
}
