import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db";

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR || "/root/hanji/uploads/claude";

export async function saveUpload(opts: {
  manuscriptId: number;
  file: File;
  kind: string;
  round?: number;
  uploadedBy: number;
}): Promise<number> {
  const { manuscriptId, file, kind, round = 1, uploadedBy } = opts;
  const dir = path.join(UPLOADS_DIR, String(manuscriptId));
  fs.mkdirSync(dir, { recursive: true });
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const stamp = Date.now().toString(36);
  const stored = path.join(dir, `${stamp}-${safeName}`);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(stored, buf);
  const info = getDb()
    .prepare(
      `INSERT INTO manuscript_files (manuscript_id, kind, filename, stored_path, size, mime, round, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(manuscriptId, kind, file.name, stored, buf.length, file.type || "", round, uploadedBy);
  return Number(info.lastInsertRowid);
}

export interface FileRow {
  id: number;
  manuscript_id: number;
  kind: string;
  filename: string;
  stored_path: string;
  size: number;
  mime: string;
  round: number;
  uploaded_by: number | null;
  created_at: string;
}

export function getFileRow(id: number): FileRow | undefined {
  return getDb()
    .prepare("SELECT * FROM manuscript_files WHERE id = ?")
    .get(id) as FileRow | undefined;
}

export function readFileBytes(row: FileRow): Buffer | null {
  try {
    return fs.readFileSync(row.stored_path);
  } catch {
    return null;
  }
}
