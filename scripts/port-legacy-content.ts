/**
 * Bring a live database up to date with content ported from the legacy
 * jceasia.org site (October 2026 migration check).
 *
 * Add-only and idempotent — nothing existing is changed or deleted:
 *   - board members in seed-content/jcea-content.json missing from the DB
 *     (matched by name + role): associate editors, assistant managing editors,
 *     social media coordinator, former editors
 *   - news items in seed-content/news.json missing from the DB (matched by title)
 *
 * Run alongside scripts/import-back-issues.ts (back issues) and
 * scripts/doaj-content-update.ts (CMS pages + settings).
 *
 * Usage: npx tsx scripts/port-legacy-content.ts
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..");
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(root, "seed-content", f), "utf8"));

const board: { name: string; role: string; affiliation: string; country: string; researchAreas: string[] }[] =
  read("jcea-content.json").board;
const news: { title: string; body: string; published_at: string }[] = read("news.json");

// Keep in sync with ROLE_ORDER in scripts/seed.ts
const ROLE_ORDER: Record<string, number> = {
  "Editor-in-Chief": 1,
  "Founding Editor-in-Chief": 2,
  "Managing Editor": 3,
  "Managing Editor & Book Review Editor": 3,
  "Book Review Editor": 4,
  "Associate Editor": 5,
  "Assistant Managing Editor": 6,
  "Social Media Coordinator": 7,
  "Editorial Board": 10,
  "Advisory Board": 20,
  "Former Managing Editor": 30,
  "Former Associate Editor": 31,
};

const db = new Database(path.join(process.env.JCEA_DATA_DIR || path.join(root, "data"), "jcea.db"));
db.pragma("journal_mode = WAL");

const hasMember = db.prepare("SELECT 1 FROM board_members WHERE name = ? AND role = ?");
const insertMember = db.prepare(
  "INSERT INTO board_members (name, role, affiliation, country, research_areas, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
);
const hasNews = db.prepare("SELECT 1 FROM news WHERE title = ?");
const insertNews = db.prepare("INSERT INTO news (title, body, published_at) VALUES (?, ?, ?)");

let members = 0;
let items = 0;
db.transaction(() => {
  for (const m of board) {
    if (hasMember.get(m.name, m.role)) continue;
    insertMember.run(
      m.name,
      m.role,
      m.affiliation || "",
      m.country || "",
      JSON.stringify(m.researchAreas || []),
      ROLE_ORDER[m.role] ?? 15
    );
    members++;
  }
  for (const n of news) {
    if (hasNews.get(n.title)) continue;
    insertNews.run(n.title, n.body, n.published_at);
    items++;
  }
})();
console.log(`board members added: ${members}; news items added: ${items}`);
