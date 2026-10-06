import { NextRequest, NextResponse } from "next/server";
import { apiUser } from "@/lib/auth";
import { buildDoiMetadata, buildDoiXml, getDoiArticle } from "@/lib/koreascience";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser("admin", "editor", "eic");
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const article = getDoiArticle(Number(id));
  if (!article) {
    return NextResponse.json(
      { error: "Article not found or not assigned to an issue" },
      { status: 404 }
    );
  }
  const format = req.nextUrl.searchParams.get("format") || "xml";
  if (format === "json") {
    return new NextResponse(JSON.stringify(buildDoiMetadata(article), null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="jcea-doi-article-${id}.json"`,
      },
    });
  }
  return new NextResponse(buildDoiXml(article), {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="jcea-doi-article-${id}.xml"`,
    },
  });
}
