/**
 * Add back issues from seed-content/real-articles.json that the database
 * does not have yet (Vol 17/1 – 23/2, ported from the legacy jceasia.org
 * archive with metadata from the accesson.kr DOI landing pages).
 *
 * Add-only and idempotent: issues already present are left untouched, so
 * existing article ids — and their public URLs — never change. Use
 * scripts/replace-real-articles.ts only to deliberately re-swap an issue.
 *
 * Usage: npx tsx scripts/import-back-issues.ts
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

interface RealArticle {
  title: string;
  authors: { name: string; affiliation: string | null }[];
  abstract: string | null;
  keywords: string[];
  pages: string | null;
  doi: string;
  koreascience_url: string | null;
  article_type: string;
}
interface RealIssue {
  volume: number;
  number: number;
  year: number;
  published_at: string;
  articles: RealArticle[];
}

const root = path.join(__dirname, "..");
const issues: RealIssue[] = JSON.parse(
  fs.readFileSync(path.join(root, "seed-content", "real-articles.json"), "utf8")
);

const db = new Database(path.join(process.env.JCEA_DATA_DIR || path.join(root, "data"), "jcea.db"));
db.pragma("journal_mode = WAL");

const findIssue = db.prepare("SELECT id FROM issues WHERE volume = ? AND number = ?");
const insertIssue = db.prepare(
  "INSERT INTO issues (volume, number, year, title, status, published_at) VALUES (?, ?, ?, '', 'published', ?)"
);
const insertArticle = db.prepare(
  `INSERT INTO articles (issue_id, title, authors_display, authors_json, abstract, keywords, pages,
     doi, doi_status, koreascience_url, article_type, order_in_issue, published_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let added = 0;
db.transaction(() => {
  for (const issue of issues) {
    if (findIssue.get(issue.volume, issue.number)) continue;
    const issueId = Number(
      insertIssue.run(issue.volume, issue.number, issue.year, issue.published_at).lastInsertRowid
    );
    issue.articles.forEach((a, i) => {
      insertArticle.run(
        issueId,
        a.title,
        a.authors.map((x) => x.name).join(", "),
        JSON.stringify(a.authors),
        a.abstract ?? "",
        JSON.stringify(a.keywords),
        a.pages ?? "",
        a.doi,
        "registered",
        a.koreascience_url ?? `https://doi.org/${a.doi}`,
        a.article_type,
        i + 1,
        issue.published_at
      );
    });
    added++;
    console.log(`Vol ${issue.volume} No ${issue.number}: added ${issue.articles.length} articles`);
  }
})();
console.log(added ? `${added} issues added` : "nothing to add — all issues present");
