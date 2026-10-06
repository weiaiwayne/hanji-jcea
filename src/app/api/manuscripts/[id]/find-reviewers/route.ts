import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { findReviewers } from "@/lib/intuitionist";

export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("editor", "eic");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const ms = db
    .prepare("SELECT id, title, abstract FROM manuscripts WHERE id = ?")
    .get(Number(id)) as { id: number; title: string; abstract: string } | undefined;
  if (!ms) return NextResponse.json({ error: "Manuscript not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const text: string =
    typeof body.manuscriptText === "string" && body.manuscriptText.trim().length >= 30
      ? body.manuscriptText
      : `${ms.title}\n\n${ms.abstract}`;

  const authors = (
    db
      .prepare("SELECT name FROM manuscript_authors WHERE manuscript_id = ?")
      .all(ms.id) as { name: string }[]
  ).map((a) => a.name);

  const result = await findReviewers({
    manuscriptText: text,
    numReviewers: Math.min(Math.max(Number(body.numReviewers) || 5, 1), 15),
    fastMode: body.fastMode !== false,
    manuscriptAuthors: authors,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
