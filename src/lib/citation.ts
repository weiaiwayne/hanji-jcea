import { parseJson } from "./db";

export interface ArticleFull {
  id: number;
  title: string;
  authors_display: string;
  authors_json: string;
  abstract: string;
  keywords: string;
  pages: string;
  doi: string;
  koreascience_url: string;
  pdf_url: string;
  published_at: string | null;
  volume?: number;
  number?: number;
  year?: number;
}

const JOURNAL = "Journal of Contemporary Eastern Asia";
const ISSN = "2383-9449";

function authorsOf(a: ArticleFull): { name: string; affiliation?: string }[] {
  const list = parseJson<{ name: string; affiliation?: string }[]>(a.authors_json, []);
  if (list.length > 0) return list;
  return a.authors_display
    .split(/,| and /)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function yearOf(a: ArticleFull): string {
  if (a.year) return String(a.year);
  if (a.published_at) return a.published_at.slice(0, 4);
  return "n.d.";
}

/** "Han Woo Park" -> {family: "Park", given: "Han Woo"} (naive western-order split) */
function splitName(name: string): { family: string; given: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { family: parts[0], given: "" };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
}

/** Titles that already end in terminal punctuation must not gain a second period. */
function endPunct(title: string): string {
  return /[.?!]$/.test(title.trim()) ? "" : ".";
}

export function toAPA(a: ArticleFull): string {
  const authors = authorsOf(a)
    .map((au) => {
      const { family, given } = splitName(au.name);
      const initials = given
        .split(/\s+/)
        .filter(Boolean)
        .map((g) => g[0].toUpperCase() + ".")
        .join(" ");
      return initials ? `${family}, ${initials}` : family;
    })
    .join(", ");
  const vol = a.volume ? `${a.volume}(${a.number})` : "";
  const pages = a.pages ? `, ${a.pages}` : "";
  const doi = a.doi ? ` https://doi.org/${a.doi}` : "";
  return `${authors} (${yearOf(a)}). ${a.title}${endPunct(a.title)} ${JOURNAL}, ${vol}${pages}.${doi}`;
}

export function toBibTeX(a: ArticleFull): string {
  const first = splitName(authorsOf(a)[0]?.name || "anon").family.toLowerCase();
  const key = `${first}${yearOf(a)}${(a.title.split(/\s+/)[0] || "").toLowerCase().replace(/[^a-z]/g, "")}`;
  const authors = authorsOf(a)
    .map((au) => {
      const { family, given } = splitName(au.name);
      return given ? `${family}, ${given}` : family;
    })
    .join(" and ");
  const lines = [
    `@article{${key},`,
    `  title   = {${a.title}},`,
    `  author  = {${authors}},`,
    `  journal = {${JOURNAL}},`,
    `  year    = {${yearOf(a)}},`,
  ];
  if (a.volume) lines.push(`  volume  = {${a.volume}},`);
  if (a.number) lines.push(`  number  = {${a.number}},`);
  if (a.pages) lines.push(`  pages   = {${a.pages}},`);
  if (a.doi) lines.push(`  doi     = {${a.doi}},`);
  lines.push(`  issn    = {${ISSN}},`);
  lines.push(`}`);
  return lines.join("\n");
}

export function toRIS(a: ArticleFull): string {
  const lines = ["TY  - JOUR", `TI  - ${a.title}`];
  for (const au of authorsOf(a)) {
    const { family, given } = splitName(au.name);
    lines.push(`AU  - ${family}${given ? ", " + given : ""}`);
  }
  lines.push(`JO  - ${JOURNAL}`);
  lines.push(`PY  - ${yearOf(a)}`);
  if (a.volume) lines.push(`VL  - ${a.volume}`);
  if (a.number) lines.push(`IS  - ${a.number}`);
  if (a.pages) {
    const [sp, ep] = a.pages.split("-");
    if (sp) lines.push(`SP  - ${sp.trim()}`);
    if (ep) lines.push(`EP  - ${ep.trim()}`);
  }
  if (a.doi) lines.push(`DO  - ${a.doi}`);
  lines.push(`SN  - ${ISSN}`);
  if (a.abstract) lines.push(`AB  - ${a.abstract.replace(/\s+/g, " ")}`);
  for (const k of parseJson<string[]>(a.keywords, [])) lines.push(`KW  - ${k}`);
  if (a.koreascience_url) lines.push(`UR  - ${a.koreascience_url}`);
  lines.push("ER  - ");
  return lines.join("\n");
}
