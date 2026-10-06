import { getDb, parseJson } from "./db";

export interface DoiArticle {
  id: number;
  title: string;
  authors_json: string;
  abstract: string;
  keywords: string;
  pages: string;
  doi: string;
  koreascience_url: string;
  published_at: string | null;
  volume: number;
  number: number;
  year: number;
}

const JOURNAL_META = {
  journal_title: "Journal of Contemporary Eastern Asia",
  journal_abbrev: "JCEA",
  issn: "2383-9449",
  publisher:
    "Cyber Emotions Research Center, Yeungnam University / World Association for Triple Helix and Future Strategy Studies (WATEF)",
  language: "en",
  license: "CC BY-NC-ND 4.0",
  license_url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
};

export function buildDoiMetadata(article: DoiArticle) {
  const authors = parseJson<{ name: string; affiliation?: string; orcid?: string }[]>(
    article.authors_json,
    []
  );
  return {
    ...JOURNAL_META,
    article: {
      title: article.title,
      authors: authors.map((a, i) => ({
        sequence: i === 0 ? "first" : "additional",
        name: a.name,
        affiliation: a.affiliation || "",
        orcid: a.orcid || "",
      })),
      abstract: article.abstract,
      keywords: parseJson<string[]>(article.keywords, []),
      volume: article.volume,
      issue: article.number,
      pages: article.pages || "",
      publication_date: article.published_at?.slice(0, 10) || `${article.year}`,
      doi: article.doi || "(to be assigned by KoreaScience)",
      full_text_url: article.koreascience_url || "",
    },
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** KoreaScience-compatible XML export (journal article metadata deposit). */
export function buildDoiXml(article: DoiArticle): string {
  const m = buildDoiMetadata(article);
  const a = m.article;
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<article_deposit xmlns="http://www.koreascience.or.kr/deposit" schema-version="1.0">`,
    `  <journal>`,
    `    <full_title>${esc(m.journal_title)}</full_title>`,
    `    <abbrev_title>${esc(m.journal_abbrev)}</abbrev_title>`,
    `    <issn media_type="electronic">${m.issn}</issn>`,
    `    <publisher>${esc(m.publisher)}</publisher>`,
    `    <language>${m.language}</language>`,
    `  </journal>`,
    `  <issue>`,
    `    <volume>${a.volume}</volume>`,
    `    <number>${a.issue}</number>`,
    `    <publication_date>${a.publication_date}</publication_date>`,
    `  </issue>`,
    `  <article>`,
    `    <title>${esc(a.title)}</title>`,
    `    <contributors>`,
    ...a.authors.flatMap((au) => [
      `      <person_name sequence="${au.sequence}" contributor_role="author">`,
      `        <name>${esc(au.name)}</name>`,
      ...(au.affiliation ? [`        <affiliation>${esc(au.affiliation)}</affiliation>`] : []),
      ...(au.orcid ? [`        <ORCID>https://orcid.org/${esc(au.orcid)}</ORCID>`] : []),
      `      </person_name>`,
    ]),
    `    </contributors>`,
    `    <abstract>${esc(a.abstract)}</abstract>`,
    `    <keywords>`,
    ...a.keywords.map((k) => `      <keyword>${esc(k)}</keyword>`),
    `    </keywords>`,
    ...(a.pages ? [`    <pages>${esc(a.pages)}</pages>`] : []),
    `    <doi>${esc(a.doi)}</doi>`,
    ...(a.full_text_url ? [`    <resource>${esc(a.full_text_url)}</resource>`] : []),
    `    <license>${esc(m.license)} — ${m.license_url}</license>`,
    `  </article>`,
    `</article_deposit>`,
  ];
  return lines.join("\n");
}

export function getDoiArticle(id: number): DoiArticle | undefined {
  return getDb()
    .prepare(
      `SELECT a.id, a.title, a.authors_json, a.abstract, a.keywords, a.pages, a.doi,
              a.koreascience_url, a.published_at, i.volume, i.number, i.year
       FROM articles a JOIN issues i ON i.id = a.issue_id WHERE a.id = ?`
    )
    .get(id) as DoiArticle | undefined;
}
