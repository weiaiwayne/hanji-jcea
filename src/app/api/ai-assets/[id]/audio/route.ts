import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = getDb()
    .prepare(
      `SELECT x.status, x.file_path,
              (a.published_at IS NOT NULL AND i.status = 'published') AS is_public
       FROM ai_assets x
       LEFT JOIN articles a ON a.id = x.article_id
       LEFT JOIN issues i ON i.id = a.issue_id
       WHERE x.id = ? AND x.type = 'podcast'`
    )
    .get(Number(id)) as
    | { status: string; file_path: string | null; is_public: number | null }
    | undefined;
  if (!asset?.file_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Approved podcasts of published articles are public; anything else
  // (drafts, or articles in unpublished issues) only for editorial staff
  const isPublic = asset.status === "approved" && asset.is_public === 1;
  if (!isPublic) {
    const user = await apiUser("admin", "editor", "eic");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let bytes: Buffer;
  try {
    bytes = fs.readFileSync(asset.file_path);
  } catch {
    return NextResponse.json({ error: "Audio file missing" }, { status: 410 });
  }
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(bytes.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-store",
    },
  });
}
