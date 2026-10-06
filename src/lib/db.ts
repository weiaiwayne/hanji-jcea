import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.JCEA_DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "jcea.db");

declare global {
  // eslint-disable-next-line no-var
  var __jceaDb: Database.Database | undefined;
}

function open(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(
    path.join(process.cwd(), "src/lib/schema.sql"),
    "utf8"
  );
  db.exec(schema);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__jceaDb) global.__jceaDb = open();
  return global.__jceaDb;
}

// ---------- helpers ----------

export function getSetting(key: string, fallback = ""): string {
  const row = getDb()
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function getSettings(): Record<string, string> {
  const rows = getDb()
    .prepare("SELECT key, value FROM site_settings")
    .all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}

export function addEvent(opts: {
  manuscriptId: number;
  actorUserId?: number | null;
  type: string;
  description: string;
  meta?: unknown;
  visibleToAuthor?: boolean;
}) {
  getDb()
    .prepare(
      `INSERT INTO editorial_events (manuscript_id, actor_user_id, type, description, meta, visible_to_author)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      opts.manuscriptId,
      opts.actorUserId ?? null,
      opts.type,
      opts.description,
      JSON.stringify(opts.meta ?? {}),
      opts.visibleToAuthor === false ? 0 : 1
    );
}

export function nextManuscriptNumber(): string {
  const year = new Date().getFullYear();
  const row = getDb()
    .prepare(
      "SELECT COUNT(*) AS n FROM manuscripts WHERE number LIKE ?"
    )
    .get(`JCEA-${year}-%`) as { n: number };
  return `JCEA-${year}-${String(row.n + 1).padStart(4, "0")}`;
}

export function parseJson<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
