/**
 * DOAJ transparency content update.
 *
 * Usage: npx tsx scripts/doaj-content-update.ts [--dry-run]
 *
 * Upserts the CMS pages and site settings in seed-content/doaj-policies.json into
 * an existing database. Idempotent, and touches nothing but `cms_pages` and
 * `site_settings` — manuscripts, issues, articles, users and the board are left
 * alone, so this is safe to run against a live database (unlike `seed.ts --reset`).
 *
 * The same pack is applied by scripts/seed.ts after the base content pack, so a
 * fresh seed and an updated database end up with identical public content.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { applyDoajPack, DOAJ_PACK_PATH } from "./doaj-pack";

const ROOT = process.cwd();
const DATA_DIR = process.env.JCEA_DATA_DIR || path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "jcea.db");
const dryRun = process.argv.includes("--dry-run");

if (!fs.existsSync(DB_PATH)) {
  console.error(`no database at ${DB_PATH} — run: npx tsx scripts/seed.ts`);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(ROOT, "src/lib/schema.sql"), "utf8"));

const counts = () =>
  ["manuscripts", "issues", "articles", "users", "board_members"]
    .map(
      (t) =>
        `${t}=${(db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n}`
    )
    .join(" ");

const before = counts();

if (dryRun) {
  const pack = JSON.parse(fs.readFileSync(DOAJ_PACK_PATH, "utf8"));
  console.log(`dry run — would upsert ${pack.pages.length} pages:`);
  for (const p of pack.pages) console.log(`  ${p.slug.padEnd(28)} ${p.title}`);
  console.log(`and ${Object.keys(pack.settings).length} settings:`);
  for (const k of Object.keys(pack.settings)) console.log(`  ${k}`);
  process.exit(0);
}

const result = applyDoajPack(db);
console.log(
  `cms pages: ${result.pagesInserted} inserted, ${result.pagesUpdated} updated`
);
console.log(`settings: ${result.settingsWritten} written`);

const after = counts();
console.log(`untouched tables before: ${before}`);
console.log(`untouched tables after:  ${after}`);
if (before !== after) {
  console.error("ERROR: row counts changed in tables this script must not touch");
  process.exit(1);
}
