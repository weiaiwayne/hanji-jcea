import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent, nextManuscriptNumber } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { saveUpload } from "@/lib/files";

export async function POST(req: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  let payload: {
    draft?: boolean;
    title?: string;
    abstract?: string;
    keywords?: string[];
    categories?: string[];
    authors?: {
      name: string;
      email: string;
      affiliation: string;
      country: string;
      orcid: string;
      is_corresponding: boolean;
    }[];
    cover_letter?: string;
    recommended_reviewers?: { name: string; affiliation: string; email: string; reason: string }[];
    checklist?: Record<string, boolean>;
    funding?: string;
    consent?: { podcast?: boolean; summary?: boolean; viz?: boolean };
  };
  try {
    payload = JSON.parse(String(fd.get("payload") || "{}"));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const isDraft = !!payload.draft;
  if (!isDraft) {
    if (!payload.title || payload.title.trim().length < 5)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!payload.abstract || payload.abstract.trim().length < 100)
      return NextResponse.json({ error: "Abstract is required (min. 100 characters)" }, { status: 400 });
    const recs = (payload.recommended_reviewers || []).filter(
      (r) => r.name?.trim() && r.affiliation?.trim() && r.reason?.trim()
    );
    if (recs.length < 3)
      return NextResponse.json(
        { error: "Three recommended reviewers with affiliations and reasons are required" },
        { status: 400 }
      );
    const manuscript = fd.get("manuscript");
    if (!(manuscript instanceof File) || manuscript.size === 0)
      return NextResponse.json({ error: "Manuscript PDF is required" }, { status: 400 });
    const c = payload.checklist || {};
    if (!c.plagiarism || !c.ethics || !c.original)
      return NextResponse.json({ error: "Checklist confirmations are required" }, { status: 400 });
  }

  const db = getDb();
  const status = isDraft ? "draft" : "submitted";
  const number = isDraft ? null : nextManuscriptNumber();

  const info = db
    .prepare(
      `INSERT INTO manuscripts
        (number, title, abstract, keywords, categories, cover_letter, recommended_reviewers,
         status, corresponding_author_id, consent_podcast, consent_summary, consent_viz,
         checklist, funding, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      number,
      payload.title?.trim() || "",
      payload.abstract?.trim() || "",
      JSON.stringify(payload.keywords || []),
      JSON.stringify(payload.categories || []),
      payload.cover_letter || "",
      JSON.stringify(payload.recommended_reviewers || []),
      status,
      user.id,
      payload.consent?.podcast ? 1 : 0,
      payload.consent?.summary ? 1 : 0,
      payload.consent?.viz ? 1 : 0,
      JSON.stringify(payload.checklist || {}),
      payload.funding || "",
      isDraft ? null : new Date().toISOString()
    );
  const msId = Number(info.lastInsertRowid);

  const insertAuthor = db.prepare(
    `INSERT INTO manuscript_authors (manuscript_id, name, email, affiliation, country, orcid, is_corresponding, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  (payload.authors || []).forEach((a, i) => {
    if (!a.name?.trim()) return;
    insertAuthor.run(
      msId,
      a.name.trim(),
      a.email || "",
      a.affiliation || "",
      a.country || "",
      a.orcid || "",
      a.is_corresponding ? 1 : 0,
      i
    );
  });

  const manuscript = fd.get("manuscript");
  if (manuscript instanceof File && manuscript.size > 0) {
    await saveUpload({ manuscriptId: msId, file: manuscript, kind: "manuscript", uploadedBy: user.id });
  }
  for (const f of fd.getAll("supplementary")) {
    if (f instanceof File && f.size > 0) {
      await saveUpload({ manuscriptId: msId, file: f, kind: "supplementary", uploadedBy: user.id });
    }
  }

  addEvent({
    manuscriptId: msId,
    actorUserId: user.id,
    type: isDraft ? "draft_saved" : "submitted",
    description: isDraft
      ? "Draft saved by author"
      : `Manuscript ${number} submitted`,
  });

  return NextResponse.json({ ok: true, id: msId, number });
}
