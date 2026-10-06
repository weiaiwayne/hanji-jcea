import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { getDb, addEvent, parseJson } from "../db";
import { ollamaGenerate, extractJson } from "./ollama";
import { buildVisualizations } from "./viz";

const execFileP = promisify(execFile);

const PYTHON = process.env.JCEA_PYTHON || path.join(process.cwd(), ".venv/bin/python3");
const EDGE_TTS = process.env.JCEA_EDGE_TTS || path.join(process.cwd(), ".venv/bin/edge-tts");
const AI_DIR = process.env.JCEA_AI_DIR || "/root/hanji/uploads/claude/ai";

export interface ManuscriptForAi {
  id: number;
  number: string;
  title: string;
  abstract: string;
  keywords: string;
  consent_podcast: number;
  consent_summary: number;
  consent_viz: number;
}

/** Full text from the latest manuscript/revision PDF, falling back to abstract. */
export async function getManuscriptText(manuscriptId: number): Promise<string> {
  const db = getDb();
  const ms = db
    .prepare("SELECT title, abstract FROM manuscripts WHERE id = ?")
    .get(manuscriptId) as { title: string; abstract: string };
  const file = db
    .prepare(
      `SELECT stored_path FROM manuscript_files
       WHERE manuscript_id = ? AND kind IN ('manuscript','revision') AND filename LIKE '%.pdf'
       ORDER BY round DESC, created_at DESC LIMIT 1`
    )
    .get(manuscriptId) as { stored_path: string } | undefined;

  if (file && fs.existsSync(file.stored_path)) {
    try {
      const { stdout } = await execFileP(
        PYTHON,
        [path.join(process.cwd(), "scripts/py/extract_pdf.py"), file.stored_path, "50000"],
        { maxBuffer: 20 * 1024 * 1024, timeout: 120_000 }
      );
      if (stdout.trim().length > 500) return stdout;
    } catch {
      // fall through to abstract
    }
  }
  return `${ms.title}\n\n${ms.abstract}`;
}

interface SummaryContent {
  overview: string;
  key_findings: string[];
  methods: string;
  implications: string;
  limitations: string;
  plain_language_abstract: string;
}

async function generateSummaryContent(title: string, text: string): Promise<SummaryContent> {
  const raw = await ollamaGenerate({
    system:
      "You are an expert science communicator writing plain-language summaries of peer-reviewed social science papers for a general audience. Respond ONLY with a JSON object.",
    prompt: `Write a structured plain-language summary of the following academic paper.

Return a JSON object with exactly these string fields (key_findings is an array of 3-5 short strings):
{"overview": "...", "key_findings": ["..."], "methods": "...", "implications": "...", "limitations": "...", "plain_language_abstract": "..."}

Rules: no jargon; each field 2-4 sentences (plain_language_abstract 3-5 sentences); be faithful to the text; do not invent findings.

PAPER TITLE: ${title}

PAPER TEXT:
${text.slice(0, 24000)}`,
    json: true,
  });
  const parsed = extractJson<Partial<SummaryContent>>(raw);
  return {
    overview: parsed.overview || "",
    key_findings: Array.isArray(parsed.key_findings) ? parsed.key_findings.map(String) : [],
    methods: parsed.methods || "",
    implications: parsed.implications || "",
    limitations: parsed.limitations || "",
    plain_language_abstract: parsed.plain_language_abstract || "",
  };
}

async function generatePodcast(
  assetId: number,
  title: string,
  text: string
): Promise<{ script: string; filePath: string }> {
  const script = await ollamaGenerate({
    system:
      "You write engaging single-narrator podcast scripts about academic research for the Journal of Contemporary Eastern Asia. Output only the words to be spoken — no headings, stage directions, sound effects, or markdown.",
    prompt: `Write a 700-900 word podcast narration (about 5-6 minutes when spoken) summarizing this paper for a curious general audience.

Structure: a one-sentence welcome to "the JCEA Research Podcast from the Journal of Contemporary Eastern Asia"; why the topic matters; what the researchers did; the key findings; what it means for the region; a one-sentence sign-off reminding listeners the full open-access article is available on KoreaScience.

PAPER TITLE: ${title}

PAPER TEXT:
${text.slice(0, 20000)}`,
  });

  const clean = script.replace(/[*#_>`]/g, "").trim();
  fs.mkdirSync(path.join(AI_DIR, "podcasts"), { recursive: true });
  const filePath = path.join(AI_DIR, "podcasts", `podcast-${assetId}.mp3`);
  const textFile = path.join(AI_DIR, "podcasts", `podcast-${assetId}.txt`);
  fs.writeFileSync(textFile, clean);
  await execFileP(
    EDGE_TTS,
    ["--voice", "en-US-AndrewNeural", "--rate", "+2%", "--file", textFile, "--write-media", filePath],
    { timeout: 300_000 }
  );
  return { script: clean, filePath };
}

/**
 * Run generation for an existing ai_assets row (status pending/failed).
 * Designed to be called without awaiting from an API route.
 */
export async function runGeneration(assetId: number): Promise<void> {
  const db = getDb();
  const asset = db
    .prepare("SELECT * FROM ai_assets WHERE id = ?")
    .get(assetId) as
    | { id: number; manuscript_id: number; type: string }
    | undefined;
  if (!asset) return;
  const ms = db
    .prepare("SELECT * FROM manuscripts WHERE id = ?")
    .get(asset.manuscript_id) as ManuscriptForAi | undefined;
  if (!ms) return;

  db.prepare(
    "UPDATE ai_assets SET status = 'generating', error = NULL, updated_at = datetime('now') WHERE id = ?"
  ).run(assetId);

  try {
    const text = await getManuscriptText(ms.id);
    if (asset.type === "summary") {
      const summary = await generateSummaryContent(ms.title, text);
      db.prepare(
        "UPDATE ai_assets SET status = 'generated', content = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(JSON.stringify(summary), assetId);
    } else if (asset.type === "podcast") {
      const { script, filePath } = await generatePodcast(assetId, ms.title, text);
      db.prepare(
        "UPDATE ai_assets SET status = 'generated', content = ?, file_path = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(JSON.stringify({ script }), filePath, assetId);
    } else if (asset.type === "visualization") {
      const keywords = parseJson<string[]>(ms.keywords, []);
      const vizItems = buildVisualizations(ms.title, text, keywords);
      db.prepare(
        "UPDATE ai_assets SET status = 'generated', content = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(JSON.stringify(vizItems), assetId);
    } else {
      throw new Error(`Unknown asset type ${asset.type}`);
    }
    addEvent({
      manuscriptId: ms.id,
      type: "ai_event",
      description: `AI ${asset.type} generated — awaiting editorial approval`,
      visibleToAuthor: true,
    });
  } catch (e) {
    db.prepare(
      "UPDATE ai_assets SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(String(e).slice(0, 1000), assetId);
  }
}
