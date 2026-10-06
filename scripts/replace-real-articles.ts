/**
 * Replace seeded demo articles with the real JCEA publication record.
 *
 * Reads seed-content/real-articles.json (captured from jceasia.org + DOI
 * landing pages on KoreaScience) and, inside one transaction:
 *   - swaps the articles of each listed issue (matched by volume+number)
 *   - unpublishes the workflow-test issue Vol 25 No 2 and unlists its article
 *
 * Papers remain hosted on KoreaScience — we store the DOI + landing URL and
 * link out; no PDFs are hosted here.
 *
 * Usage: npx tsx scripts/replace-real-articles.ts
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

interface RealAuthor {
  name: string;
  affiliation: string | null;
}
interface RealArticle {
  title: string;
  authors: RealAuthor[];
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

const db = new Database(path.join(root, "data", "jcea.db"));
db.pragma("journal_mode = WAL");

const findIssue = db.prepare(
  "SELECT id FROM issues WHERE volume = ? AND number = ?"
);
const deleteArticles = db.prepare("DELETE FROM articles WHERE issue_id = ?");
const insertArticle = db.prepare(
  `INSERT INTO articles (issue_id, title, authors_display, authors_json, abstract, keywords, pages,
     doi, doi_status, koreascience_url, article_type, order_in_issue, published_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const run = db.transaction(() => {
  for (const issue of issues) {
    const row = findIssue.get(issue.volume, issue.number) as
      | { id: number }
      | undefined;
    if (!row) throw new Error(`Issue ${issue.volume}/${issue.number} not found`);
    deleteArticles.run(row.id);
    issue.articles.forEach((a, i) => {
      insertArticle.run(
        row.id,
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
    console.log(
      `Vol ${issue.volume} No ${issue.number}: ${issue.articles.length} real articles`
    );
  }

  // The Vol 25 No 2 issue was created during workflow testing and does not
  // exist on the real journal — unpublish it and unlist its article.
  const test = findIssue.get(25, 2) as { id: number } | undefined;
  if (test) {
    db.prepare("UPDATE issues SET status = 'in_progress' WHERE id = ?").run(test.id);
    db.prepare("UPDATE articles SET published_at = NULL WHERE issue_id = ?").run(test.id);
    console.log("Vol 25 No 2 (workflow-test issue): unpublished");
  }
});
run();

const counts = db
  .prepare(
    `SELECT i.volume, i.number, i.status, COUNT(a.id) n FROM issues i
     LEFT JOIN articles a ON a.issue_id = i.id GROUP BY i.id ORDER BY i.volume, i.number`
  )
  .all();
console.log(counts);
