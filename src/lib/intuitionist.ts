import Database from "better-sqlite3";
import { getDb } from "./db";

const BASE = process.env.INTUITIONIST_URL || "http://localhost:3848/api/intuitionist";
const INTUITIONIST_DB =
  process.env.INTUITIONIST_DB || "/root/agentacademy/intuitionist/data/intuitionist.db";

export interface IntuitionistCandidate {
  rank: number;
  name: string;
  affiliation: string;
  orcid: string;
  openalex_id: string;
  h_index: number;
  paper_count: number;
  composite_score: number;
  embedding_similarity: number;
  concept_overlap: number;
  journal_community_score: number;
  seniority: "emerging" | "mid-career" | "senior";
  relevant_papers: string[];
  justification: string;
  source: string;
  conflicts: { is_cited_author: boolean; is_same_institution: boolean };
}

export interface PaperAnalysis {
  key_concepts: string[];
  methodology_type: string;
  methods: string[];
  target_journals: string[];
  disciplines: string[];
  theories: string[];
}

export interface JceaConflict {
  coauthored_recent: boolean; // co-authorship with a manuscript author in last 5 years
  coauthored_with: string[];
  recently_invited: boolean; // invited for a JCEA review in last 12 months
  same_institution: boolean;
  is_cited_author: boolean;
  is_manuscript_author: boolean;
  phd_unverified: boolean; // always true — editor must confirm PhD manually
  has_blocking_conflict: boolean;
}

export type ProcessedCandidate = IntuitionistCandidate & { jcea: JceaConflict };

export interface FindReviewersResult {
  ok: boolean;
  error?: string;
  paper_analysis?: PaperAnalysis;
  privacy_notice?: string;
  reviewers: ProcessedCandidate[];
}

export async function intuitionistHealth(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(4000) });
    const body = await res.json();
    return { ok: res.ok && body.status === "ok", detail: JSON.stringify(body) };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Loose person-name match: exact normalized match, or same last name + same first initial. */
function namesMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const pa = na.split(" ");
  const pb = nb.split(" ");
  const lastA = pa[pa.length - 1];
  const lastB = pb[pb.length - 1];
  return lastA === lastB && pa[0][0] === pb[0][0];
}

/**
 * Check the Intuitionist corpus (read-only) for papers co-authored by the
 * candidate and any manuscript author within the last 5 years.
 */
function checkCoauthorship(
  candidate: { name: string; openalex_id?: string },
  manuscriptAuthors: string[]
): { coauthored: boolean; with: string[] } {
  let idb: Database.Database | null = null;
  const hits = new Set<string>();
  try {
    idb = new Database(INTUITIONIST_DB, { readonly: true, fileMustExist: true });
    const cutoff = `${new Date().getFullYear() - 5}-01-01`;
    let authorIds: number[] = [];
    if (candidate.openalex_id) {
      authorIds = (
        idb
          .prepare("SELECT id FROM authors WHERE openalex_id = ?")
          .all(candidate.openalex_id) as { id: number }[]
      ).map((r) => r.id);
    }
    if (authorIds.length === 0) {
      authorIds = (
        idb
          .prepare("SELECT id, name FROM authors WHERE name LIKE ?")
          .all(`%${candidate.name.split(" ").pop()}%`) as { id: number; name: string }[]
      )
        .filter((r) => namesMatch(r.name, candidate.name))
        .map((r) => r.id);
    }
    if (authorIds.length === 0) return { coauthored: false, with: [] };

    const placeholders = authorIds.map(() => "?").join(",");
    const coauthors = idb
      .prepare(
        `SELECT DISTINCT a2.name AS coname
         FROM paper_authors pa1
         JOIN papers p ON p.id = pa1.paper_id
         JOIN paper_authors pa2 ON pa2.paper_id = pa1.paper_id AND pa2.author_id != pa1.author_id
         JOIN authors a2 ON a2.id = pa2.author_id
         WHERE pa1.author_id IN (${placeholders})
           AND p.published >= ?`
      )
      .all(...authorIds, cutoff) as { coname: string }[];
    for (const co of coauthors) {
      for (const ma of manuscriptAuthors) {
        if (namesMatch(co.coname, ma)) hits.add(ma);
      }
    }
  } catch {
    // corpus unavailable — skip silently; flag remains false and the editor
    // still sees the "PhD / conflicts require confirmation" notice
  } finally {
    idb?.close();
  }
  return { coauthored: hits.size > 0, with: [...hits] };
}

/** Was this person invited to review for JCEA in the last `months` months? */
function checkRecentlyInvited(name: string, months = 12): boolean {
  const rows = getDb()
    .prepare(
      `SELECT reviewer_name FROM reviewer_assignments
       WHERE invited_at >= datetime('now', ?) AND status != 'cancelled'`
    )
    .all(`-${months} months`) as { reviewer_name: string }[];
  return rows.some((r) => namesMatch(r.reviewer_name, name));
}

export function applyJceaRules(
  candidates: IntuitionistCandidate[],
  manuscriptAuthors: string[]
): ProcessedCandidate[] {
  return candidates.map((c) => {
    const co = checkCoauthorship(c, manuscriptAuthors);
    const isAuthor = manuscriptAuthors.some((a) => namesMatch(a, c.name));
    const recentlyInvited = checkRecentlyInvited(c.name);
    const jcea: JceaConflict = {
      coauthored_recent: co.coauthored,
      coauthored_with: co.with,
      recently_invited: recentlyInvited,
      same_institution: !!c.conflicts?.is_same_institution,
      is_cited_author: !!c.conflicts?.is_cited_author,
      is_manuscript_author: isAuthor,
      phd_unverified: true,
      has_blocking_conflict:
        isAuthor || co.coauthored || recentlyInvited || !!c.conflicts?.is_same_institution,
    };
    return { ...c, jcea };
  });
}

export async function findReviewers(opts: {
  manuscriptText: string;
  numReviewers?: number;
  fastMode?: boolean;
  manuscriptAuthors?: string[];
}): Promise<FindReviewersResult> {
  const { manuscriptText, numReviewers = 5, fastMode = true, manuscriptAuthors = [] } = opts;
  try {
    const endpoint = fastMode ? "find-reviewers" : "find-reviewers-with-expansion";
    const body: Record<string, unknown> = {
      abstract: manuscriptText,
      manuscript_text: manuscriptText,
      num_reviewers: numReviewers,
    };
    if (fastMode) body.fast_mode = true;
    else {
      body.auto_expand = false;
      body.min_candidates_threshold = 3;
    }
    const res = await fetch(`${BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(fastMode ? 120_000 : 300_000),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Intuitionist API error ${res.status}: ${text.slice(0, 300)}`, reviewers: [] };
    }
    const data = await res.json();
    const raw: IntuitionistCandidate[] = data.reviewers ?? [];
    return {
      ok: true,
      paper_analysis: data.paper_analysis,
      privacy_notice: data.privacy_notice,
      reviewers: applyJceaRules(raw, manuscriptAuthors),
    };
  } catch (e) {
    return { ok: false, error: `Could not reach Intuitionist API: ${String(e)}`, reviewers: [] };
  }
}
