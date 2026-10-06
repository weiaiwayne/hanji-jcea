import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent, parseJson } from "@/lib/db";
import { apiUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("editor", "eic", "admin");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const issue = db
    .prepare("SELECT * FROM issues WHERE id = ?")
    .get(Number(id)) as { id: number; volume: number; number: number; status: string } | undefined;
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const ms = db
    .prepare("SELECT * FROM manuscripts WHERE id = ?")
    .get(Number(body.manuscriptId)) as
    | { id: number; number: string; title: string; abstract: string; keywords: string; status: string }
    | undefined;
  if (!ms) return NextResponse.json({ error: "Manuscript not found" }, { status: 404 });
  if (ms.status !== "accepted") {
    return NextResponse.json(
      { error: "Only accepted manuscripts can be assigned to an issue" },
      { status: 400 }
    );
  }
  const existing = db
    .prepare("SELECT id FROM articles WHERE manuscript_id = ?")
    .get(ms.id);
  if (existing) {
    return NextResponse.json({ error: "Manuscript is already assigned to an issue" }, { status: 409 });
  }

  const authors = db
    .prepare("SELECT name, affiliation, orcid FROM manuscript_authors WHERE manuscript_id = ? ORDER BY position")
    .all(ms.id) as { name: string; affiliation: string; orcid: string }[];

  const maxOrder = db
    .prepare("SELECT COALESCE(MAX(order_in_issue), 0) AS m FROM articles WHERE issue_id = ?")
    .get(issue.id) as { m: number };

  const info = db
    .prepare(
      `INSERT INTO articles (manuscript_id, issue_id, title, authors_display, authors_json, abstract, keywords, order_in_issue, doi_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'none')`
    )
    .run(
      ms.id,
      issue.id,
      ms.title,
      authors.map((a) => a.name).join(", "),
      JSON.stringify(authors),
      ms.abstract,
      JSON.stringify(parseJson<string[]>(ms.keywords, [])),
      maxOrder.m + 1
    );

  addEvent({
    manuscriptId: ms.id,
    actorUserId: user.id,
    type: "status_change",
    description: `Assigned to Vol. ${issue.volume}, No. ${issue.number}`,
  });

  return NextResponse.json({ ok: true, articleId: Number(info.lastInsertRowid) });
}
