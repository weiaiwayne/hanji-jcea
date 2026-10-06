import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { buildDoiMetadata, buildDoiXml, getDoiArticle } from "@/lib/koreascience";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin", "editor", "eic");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const db = getDb();
  const issue = db
    .prepare("SELECT * FROM issues WHERE id = ?")
    .get(Number(id)) as { id: number; volume: number; number: number } | undefined;
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

  const articleIds = (
    db.prepare("SELECT id FROM articles WHERE issue_id = ? ORDER BY order_in_issue").all(issue.id) as {
      id: number;
    }[]
  ).map((r) => r.id);
  const articles = articleIds
    .map((aid) => getDoiArticle(aid))
    .filter((a): a is NonNullable<typeof a> => !!a);

  const format = req.nextUrl.searchParams.get("format") || "xml";
  const filename = `jcea-doi-vol${issue.volume}-no${issue.number}`;
  if (format === "json") {
    return new NextResponse(
      JSON.stringify(articles.map((a) => buildDoiMetadata(a)), null, 2),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      }
    );
  }
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<issue_deposit volume="${issue.volume}" number="${issue.number}">`,
    ...articles.map((a) =>
      buildDoiXml(a).split("\n").slice(1).join("\n") // strip inner XML declarations
    ),
    `</issue_deposit>`,
  ].join("\n");
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="${filename}.xml"`,
    },
  });
}
