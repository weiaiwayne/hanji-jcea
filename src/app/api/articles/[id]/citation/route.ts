import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { toBibTeX, toRIS, toAPA, type ArticleFull } from "@/lib/citation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = getDb()
    .prepare(
      `SELECT a.*, i.volume, i.number, i.year FROM articles a
       JOIN issues i ON i.id = a.issue_id
       WHERE a.id = ? AND a.published_at IS NOT NULL AND i.status = 'published'`
    )
    .get(Number(id)) as ArticleFull | undefined;
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  const format = req.nextUrl.searchParams.get("format") || "bibtex";
  if (format === "ris") {
    return new NextResponse(toRIS(article), {
      headers: {
        "Content-Type": "application/x-research-info-systems",
        "Content-Disposition": `attachment; filename="jcea-article-${id}.ris"`,
      },
    });
  }
  if (format === "apa") {
    return new NextResponse(toAPA(article), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new NextResponse(toBibTeX(article), {
    headers: {
      "Content-Type": "application/x-bibtex",
      "Content-Disposition": `attachment; filename="jcea-article-${id}.bib"`,
    },
  });
}
