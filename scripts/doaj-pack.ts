/**
 * Shared loader for the DOAJ transparency content pack
 * (seed-content/doaj-policies.json), used by both scripts/seed.ts and
 * scripts/doaj-content-update.ts so a fresh seed and an in-place update produce
 * identical public content.
 */
import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export interface DoajPack {
  notes?: string;
  settings: Record<string, string>;
  pages: { slug: string; title: string; html: string; nav_order?: number }[];
}

export const DOAJ_PACK_PATH =
  process.env.JCEA_DOAJ_PACK ||
  path.join(process.cwd(), "seed-content/doaj-policies.json");

export function loadDoajPack(): DoajPack {
  return JSON.parse(fs.readFileSync(DOAJ_PACK_PATH, "utf8")) as DoajPack;
}

/** Upserts the pack's pages and settings. Idempotent; touches no other table. */
export function applyDoajPack(db: Database.Database) {
  const pack = loadDoajPack();

  const setSetting = db.prepare(
    "INSERT INTO site_settings (key, value) VALUES (?, ?) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  const upsertPage = db.prepare(
    "INSERT INTO cms_pages (slug, title, html, nav_order, show_in_nav, updated_at) " +
      "VALUES (@slug, @title, @html, @nav_order, 1, datetime('now')) " +
      "ON CONFLICT(slug) DO UPDATE SET title = excluded.title, html = excluded.html, " +
      "nav_order = excluded.nav_order, show_in_nav = 1, updated_at = datetime('now')"
  );
  const exists = db.prepare("SELECT 1 FROM cms_pages WHERE slug = ?");

  let pagesInserted = 0;
  let pagesUpdated = 0;
  let settingsWritten = 0;

  db.transaction(() => {
    for (const [k, v] of Object.entries(pack.settings)) {
      setSetting.run(k, v);
      settingsWritten++;
    }
    for (const p of pack.pages) {
      if (exists.get(p.slug)) pagesUpdated++;
      else pagesInserted++;
      upsertPage.run({
        slug: p.slug,
        title: p.title,
        html: p.html,
        nav_order: p.nav_order ?? 100,
      });
    }
  })();

  return { pagesInserted, pagesUpdated, settingsWritten };
}
