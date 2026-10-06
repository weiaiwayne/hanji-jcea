/**
 * JCEA Editorial System — database seed.
 *
 * Usage: npx tsx scripts/seed.ts [--reset]
 *
 * Seeds: site settings, CMS pages (scraped from jceasia.org), editorial board,
 * news, users (admin/eic/editors/author/reviewers — see README for logins),
 * demo issues + articles, and demo manuscripts across the workflow, including
 * one accepted manuscript with full AI consent for pipeline demos.
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { applyDoajPack } from "./doaj-pack";

const ROOT = process.cwd();
const DATA_DIR = process.env.JCEA_DATA_DIR || path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "jcea.db");
const UPLOADS_DIR = process.env.UPLOADS_DIR || "/root/hanji/uploads/claude";
const CONTENT_PACK = process.env.JCEA_CONTENT_PACK || path.join(ROOT, "seed-content/jcea-content.json");
const PYTHON = path.join(ROOT, ".venv/bin/python3");

if (process.argv.includes("--reset") && fs.existsSync(DB_PATH)) {
  fs.rmSync(DB_PATH);
  fs.rmSync(DB_PATH + "-wal", { force: true });
  fs.rmSync(DB_PATH + "-shm", { force: true });
  console.log("existing database removed");
}

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(ROOT, "src/lib/schema.sql"), "utf8"));

const already = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
if (already > 0) {
  console.log("database already seeded — run with --reset to reseed from scratch");
  process.exit(0);
}

// ---------------------------------------------------------------- content pack
interface ContentPack {
  pages: { slug: string; title: string; html: string }[];
  board: { name: string; role: string; affiliation: string; country: string; researchAreas: string[] }[];
  settings: Record<string, string>;
}
const pack: ContentPack = JSON.parse(fs.readFileSync(CONTENT_PACK, "utf8"));

// ---------------------------------------------------------------- settings
const s = pack.settings;
const settings: Record<string, string> = {
  journal_name: s.journalName || "Journal of Contemporary Eastern Asia",
  journal_abbrev: s.journalAbbreviation || "JCEA",
  issn: s.issn || "2383-9449",
  frequency: s.frequency || "Biannual",
  publisher: s.publisher || "Cyber Emotions Research Center, Yeungnam University and WATEF",
  apc: s.apc || "USD 100 (KRW 150,000); USD 300 (KRW 450,000) for funded research",
  contact_email: s.contactEmail || "j.c.eastern.asia@gmail.com",
  support_email: s.technicalSupportEmail || "acomsplus@kisti.re.kr",
  postal_address:
    s.postalAddress ||
    "Cyber Emotions Research Center, YeungNam University, 280 Daehak-Ro, Gyeongsan, Gyeongbuk, Republic of Korea",
  license: "CC BY-NC-ND 4.0",
  ai_features_enabled: "yes",
  demo_mode: "yes", // one-click demo sign-in on the login page; set to "no" for production

  ollama_model: process.env.OLLAMA_MODEL || "mistral:7b",
};
const setSetting = db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?)");
for (const [k, v] of Object.entries(settings)) setSetting.run(k, v);
console.log(`settings: ${Object.keys(settings).length}`);

// ---------------------------------------------------------------- CMS pages
const SLUG_MAP: Record<string, string> = {
  cfp2025: "call-for-papers",
  "conference-2025": "conference",
};
const SKIP_PAGES = new Set(["home", "editorial-board"]); // dynamic pages in the app
const insertPage = db.prepare(
  "INSERT INTO cms_pages (slug, title, html, nav_order) VALUES (?, ?, ?, ?)"
);
let navOrder = 10;
for (const p of pack.pages) {
  if (SKIP_PAGES.has(p.slug)) continue;
  insertPage.run(SLUG_MAP[p.slug] || p.slug, p.title, p.html, navOrder);
  navOrder += 10;
}
console.log(`cms pages: ${pack.pages.length - SKIP_PAGES.size}`);

// DOAJ transparency pack — rewritten policy pages + new ones, applied over the
// jceasia.org scrape above. See seed-content/doaj-policies.json.
const doaj = applyDoajPack(db);
console.log(
  `doaj pack: ${doaj.pagesInserted} pages added, ${doaj.pagesUpdated} rewritten, ${doaj.settingsWritten} settings`
);

// ---------------------------------------------------------------- board
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
const insertMember = db.prepare(
  "INSERT INTO board_members (name, role, affiliation, country, research_areas, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
);
for (const m of pack.board) {
  insertMember.run(
    m.name,
    m.role,
    m.affiliation || "",
    m.country || "",
    JSON.stringify(m.researchAreas || []),
    ROLE_ORDER[m.role] ?? 15
  );
}
console.log(`board members: ${pack.board.length}`);

// ---------------------------------------------------------------- news
const insertNews = db.prepare(
  "INSERT INTO news (title, body, published_at) VALUES (?, ?, ?)"
);
const newsItems: { title: string; body: string; published_at: string }[] = JSON.parse(
  fs.readFileSync(path.join(ROOT, "seed-content", "news.json"), "utf8")
);
for (const n of newsItems) insertNews.run(n.title, n.body, n.published_at);
console.log(`news: ${newsItems.length}`);

// ---------------------------------------------------------------- users
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const insertUser = db.prepare(
  "INSERT INTO users (email, password_hash, name, affiliation, country, roles) VALUES (?, ?, ?, ?, ?, ?)"
);
const PW = "jcea-demo-2026";
const users = [
  ["admin@jcea.demo", "System Administrator", "JCEA Editorial Office", "South Korea", "admin"],
  ["eic@jcea.demo", "Han Woo Park", "Yeungnam University", "South Korea", "editor,eic"],
  ["editor.zhang@jcea.demo", "Dechun Zhang", "Leiden University", "Netherlands", "editor"],
  ["editor.tkach@jcea.demo", "Leslie Tkach-Kawasaki", "University of Tsukuba", "Japan", "editor"],
  ["editor.xu@jcea.demo", "Weiai Wayne Xu", "University of Massachusetts Amherst", "United States", "editor"],
  ["author@jcea.demo", "Mina Seo", "Seoul National University", "South Korea", "author"],
  ["author2@jcea.demo", "Kenji Tanaka", "Waseda University", "Japan", "author"],
  ["reviewer1@jcea.demo", "Grace Lim", "Nanyang Technological University", "Singapore", "reviewer"],
  ["reviewer2@jcea.demo", "Thomas Berger", "Freie Universität Berlin", "Germany", "reviewer"],
] as const;
const userIds: Record<string, number> = {};
for (const [email, name, affiliation, country, roles] of users) {
  const info = insertUser.run(email, hash(PW), name, affiliation, country, roles);
  userIds[email] = Number(info.lastInsertRowid);
}
console.log(`users: ${users.length} (password for all: ${PW})`);

// ---------------------------------------------------------------- issues + articles
const insertIssue = db.prepare(
  "INSERT INTO issues (volume, number, year, title, status, published_at) VALUES (?, ?, ?, ?, ?, ?)"
);
const insertArticle = db.prepare(
  `INSERT INTO articles (issue_id, title, authors_display, authors_json, abstract, keywords, pages,
     doi, doi_status, koreascience_url, article_type, order_in_issue, published_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// Real JCEA publication record (captured from jceasia.org + KoreaScience DOI
// landing pages). Papers stay hosted on KoreaScience — we store DOI + link only.
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
const realIssues: RealIssue[] = JSON.parse(
  fs.readFileSync(path.join(ROOT, "seed-content", "real-articles.json"), "utf8")
);

let articleCount = 0;
for (const issue of realIssues) {
  const issueId = Number(
    insertIssue.run(issue.volume, issue.number, issue.year, "", "published", issue.published_at).lastInsertRowid
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
    articleCount++;
  });
}

console.log(`issues: ${realIssues.length} published (${articleCount} articles)`);

// ---------------------------------------------------------------- demo manuscripts
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function makePdf(manuscriptId: number, title: string, abstract: string, keywords: string[]): string {
  const dir = path.join(UPLOADS_DIR, String(manuscriptId));
  fs.mkdirSync(dir, { recursive: true });
  const bodyFile = path.join(dir, "_body.txt");
  const body = [
    `Abstract\n\n${abstract}`,
    `Keywords: ${keywords.join(", ")}`,
    `1. Introduction\n\nEast and Southeast Asia have become central sites for research on digital politics, platform societies, and regional innovation systems. This manuscript examines these dynamics with particular attention to ${keywords[0]}. Prior work (Park, 2014; Tkach-Kawasaki, 2018; Xu, 2020) established the importance of relational approaches, while more recent studies (Zhang, 2023; Chen and Lee, 2024) highlight platform-specific affordances. We build on this literature to ask how ${keywords[1] || "regional actors"} shape contemporary outcomes.`,
    `2. Literature Review\n\nResearch on ${keywords[0]} has expanded rapidly since the early 2010s (Kim, 2012; Sato, 2015). Network perspectives (Wasserman and Faust, 1994; Barabasi, 2016) inform our approach, as do studies of East Asian media systems (Lee, 2019; Nakamura, 2021) and comparative platform governance (Gorwa, 2022; Tan, 2023). A second stream concerns ${keywords[1] || "institutional change"} (Etzkowitz and Leydesdorff, 2000; Park and Leydesdorff, 2010), which we connect to debates on digital civil society (Ho, 2017; Nguyen, 2022).`,
    `3. Data and Methods\n\nWe collected data between January 2024 and December 2025, combining computational text analysis with semi-structured interviews (N = 38). Network matrices were constructed from co-occurrence patterns and analyzed with community detection. Robustness checks used alternative thresholds and bootstrap resampling (Efron, 1987; Snijders and Borgatti, 1999).`,
    `4. Findings\n\nThree findings stand out. First, discourse communities are strongly clustered along linguistic and platform lines. Second, brokerage positions are occupied by a small number of hybrid actors who translate between communities. Third, temporal analysis reveals rapid reconfiguration around focusing events, consistent with punctuated equilibrium accounts (True et al., 2007; Baumgartner, 2013).`,
    `5. Discussion and Conclusion\n\nThe results carry implications for theory and policy. Theoretically, they refine accounts of networked publics in East Asia (boyd, 2010; Papacharissi, 2015; Park, 2024). Practically, they suggest that regional cooperation frameworks should attend to platform-level brokerage. Limitations include single-region scope and platform API constraints; future research should extend the comparison across Southeast Asia (Lim, 2021; Wibowo, 2025).`,
    `References\n\nSelected references are embedded in the text above for demonstration purposes.`,
  ].join("\n\n");
  fs.writeFileSync(bodyFile, body);
  const out = path.join(dir, "manuscript.pdf");
  execFileSync(PYTHON, [path.join(ROOT, "scripts/py/make_demo_pdf.py"), out, title, bodyFile]);
  fs.rmSync(bodyFile);
  return out;
}

const insertMs = db.prepare(
  `INSERT INTO manuscripts (number, title, abstract, keywords, categories, cover_letter,
     recommended_reviewers, status, corresponding_author_id, handling_editor_id,
     consent_podcast, consent_summary, consent_viz, checklist, funding, round, submitted_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
);
const insertMsAuthor = db.prepare(
  `INSERT INTO manuscript_authors (manuscript_id, name, email, affiliation, country, is_corresponding, position)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const insertFile = db.prepare(
  `INSERT INTO manuscript_files (manuscript_id, kind, filename, stored_path, size, mime, round, uploaded_by)
   VALUES (?, ?, ?, ?, ?, 'application/pdf', ?, ?)`
);
const insertEvent = db.prepare(
  `INSERT INTO editorial_events (manuscript_id, actor_user_id, type, description, visible_to_author, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const insertAssignment = db.prepare(
  `INSERT INTO reviewer_assignments (manuscript_id, reviewer_user_id, reviewer_name, reviewer_email,
     reviewer_affiliation, source, status, round, due_date, invited_at, responded_at, completed_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertReview = db.prepare(
  `INSERT INTO reviews (assignment_id, manuscript_id, round, recommendation, comments_general,
     comments_sections, comments_confidential, score_novelty, score_rigor, score_significance,
     score_clarity, conflict_declared, status, submitted_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'submitted', ?)`
);
const insertDecision = db.prepare(
  "INSERT INTO decisions (manuscript_id, round, decision, letter, decided_by, created_at) VALUES (?, ?, ?, ?, ?, ?)"
);

const recReviewers = JSON.stringify([
  { name: "Prof. Sang-Hee Yoon", affiliation: "KAIST", email: "", reason: "Leading scholar on computational social science in Korea" },
  { name: "Dr. Marta Kowalska", affiliation: "University of Warsaw", email: "", reason: "Published extensively on comparative platform governance" },
  { name: "Prof. Hiroshi Ito", affiliation: "Kyoto University", email: "", reason: "Expert on East Asian media systems and networks" },
]);
const checklist = JSON.stringify({ original: true, plagiarism: true, ethics: true, funding: true });

// 1) Newly submitted
const ms1Id = Number(
  insertMs.run(
    "JCEA-2026-0001",
    "Civic Tech and Local Democracy: Participatory Budgeting Platforms in Seoul and Taipei",
    "Participatory budgeting has migrated online across East Asian cities. Comparing Seoul's mVoting and Taipei's i-Voting platforms, this study analyzes 5,800 citizen proposals and interviews with 24 officials to assess whether civic tech platforms broaden participation or amplify existing voice inequalities. Preliminary results indicate that platform design choices — particularly proposal thresholds and deliberation windows — significantly shape who participates and which proposals survive. The study contributes to debates on digital democratic innovation in Asia and offers design recommendations for municipal civic technology.",
    JSON.stringify(["civic technology", "participatory budgeting", "Seoul", "Taipei", "digital democracy"]),
    JSON.stringify(["Politics & International Relations", "Internet Research"]),
    "Dear Editor-in-Chief,\n\nPlease consider our manuscript for publication in JCEA. The study offers the first systematic comparison of participatory budgeting platforms in Seoul and Taipei and fits JCEA's scope on political trends and Internet research in East Asia.\n\nAs required, we recommend three expert reviewers with affiliations and reasons in the submission form.\n\nSincerely,\nMina Seo",
    recReviewers,
    "submitted",
    userIds["author@jcea.demo"],
    null,
    0, 1, 0,
    checklist,
    "No funding received",
    1,
    "2026-07-20 09:15:00"
  ).lastInsertRowid
);
insertMsAuthor.run(ms1Id, "Mina Seo", "author@jcea.demo", "Seoul National University", "South Korea", 1, 0);
insertMsAuthor.run(ms1Id, "Chia-Ling Hsu", "", "National Chengchi University", "Taiwan", 0, 1);
{
  const pdf = makePdf(
    ms1Id,
    "Civic Tech and Local Democracy: Participatory Budgeting Platforms in Seoul and Taipei",
    "Participatory budgeting has migrated online across East Asian cities...",
    ["civic technology", "participatory budgeting"]
  );
  insertFile.run(ms1Id, "manuscript", "seo-hsu-civic-tech.pdf", pdf, fs.statSync(pdf).size, 1, userIds["author@jcea.demo"]);
}
insertEvent.run(ms1Id, userIds["author@jcea.demo"], "submitted", "Manuscript JCEA-2026-0001 submitted", 1, "2026-07-20 09:15:00");

// 2) Under review with two reviewers (one review completed)
const ms2Id = Number(
  insertMs.run(
    "JCEA-2026-0002",
    "Memes Against the Machine: Visual Political Humor and Censorship Circumvention on Chinese Social Media",
    "Political humor persists on Chinese social media despite intensive content moderation. Drawing on a corpus of 12,400 memes collected from Weibo and WeChat between 2023 and 2025, this study analyzes the visual and linguistic strategies through which users encode political critique. We develop a typology of circumvention tactics — homophonic substitution, visual allegory, temporal displacement, and platform arbitrage — and trace their lifecycle against takedown data. Findings show an adaptive arms race in which memetic innovation temporarily outpaces automated moderation, with implications for theories of authoritarian resilience and networked expression in China.",
    JSON.stringify(["censorship", "memes", "China", "social media", "political communication"]),
    JSON.stringify(["Media & Communication", "Cyber Communication"]),
    "Dear Editor-in-Chief,\n\nWe submit our manuscript on visual political humor and censorship circumvention for consideration. Three recommended reviewers are listed with affiliations and reasons.\n\nKenji Tanaka",
    recReviewers,
    "under_review",
    userIds["author2@jcea.demo"],
    userIds["editor.xu@jcea.demo"],
    1, 1, 1,
    checklist,
    "JSPS KAKENHI Grant 24K01234",
    1,
    "2026-06-28 14:30:00"
  ).lastInsertRowid
);
insertMsAuthor.run(ms2Id, "Kenji Tanaka", "author2@jcea.demo", "Waseda University", "Japan", 1, 0);
{
  const pdf = makePdf(
    ms2Id,
    "Memes Against the Machine: Visual Political Humor and Censorship Circumvention on Chinese Social Media",
    "Political humor persists on Chinese social media despite intensive content moderation...",
    ["censorship", "memes"]
  );
  insertFile.run(ms2Id, "manuscript", "tanaka-memes.pdf", pdf, fs.statSync(pdf).size, 1, userIds["author2@jcea.demo"]);
}
insertEvent.run(ms2Id, userIds["author2@jcea.demo"], "submitted", "Manuscript JCEA-2026-0002 submitted", 1, "2026-06-28 14:30:00");
insertEvent.run(ms2Id, userIds["eic@jcea.demo"], "editor_assigned", "Handling editor assigned: Weiai Wayne Xu", 0, "2026-06-30 10:00:00");
insertEvent.run(ms2Id, userIds["editor.xu@jcea.demo"], "status_change", "Manuscript moved to Under Review", 1, "2026-07-02 11:00:00");

const a1 = Number(
  insertAssignment.run(
    ms2Id, userIds["reviewer1@jcea.demo"], "Grace Lim", "reviewer1@jcea.demo",
    "Nanyang Technological University", "intuitionist", "completed", 1,
    "2026-07-23", "2026-07-02 11:05:00", "2026-07-03 08:00:00", "2026-07-18 16:40:00"
  ).lastInsertRowid
);
insertAssignment.run(
  ms2Id, userIds["reviewer2@jcea.demo"], "Thomas Berger", "reviewer2@jcea.demo",
  "Freie Universität Berlin", "manual", "accepted", 1,
  "2026-08-01", "2026-07-02 11:06:00", "2026-07-04 09:30:00", null
);
insertReview.run(
  a1, ms2Id, 1, "minor_revision",
  "This is a strong and timely contribution. The meme corpus is impressive and the typology of circumvention tactics is genuinely novel. The manuscript would benefit from clearer sampling documentation and a fuller engagement with prior work on homophonic wordplay.",
  "Methods: please clarify how takedown timestamps were validated.\nFindings: Figure 3 needs larger labels.\nDiscussion: the authoritarian resilience framing could be sharpened.",
  "I have no concerns about the integrity of the study. A solid accept after minor changes.",
  4, 4, 5, 4,
  "2026-07-18 16:40:00"
);
insertEvent.run(ms2Id, userIds["reviewer1@jcea.demo"], "review_submitted", "A peer review was submitted", 1, "2026-07-18 16:40:00");

// 3) Accepted with all AI consents — ready for issue assignment + AI demos
const ms3Id = Number(
  insertMs.run(
    "JCEA-2026-0003",
    "Mapping Cross-Border Knowledge Networks: Co-Authorship between ASEAN and Northeast Asian Universities, 2010–2025",
    "Scientific collaboration between Southeast and Northeast Asia has intensified but remains unevenly mapped. Using bibliometric data on 480,000 co-authored publications from 2010 to 2025, this study reconstructs the evolving knowledge network linking ASEAN universities with partners in China, Japan, South Korea, and Taiwan. Community detection reveals a shift from bilateral hub-and-spoke structures centered on Japan toward a multipolar configuration in which Chinese universities anchor dense subregional clusters. Gravity models show that research funding agreements and student mobility programs predict tie formation beyond geographic and linguistic proximity. The findings inform debates on regional integration, science diplomacy, and the Triple Helix in Asia.",
    JSON.stringify(["co-authorship networks", "ASEAN", "science diplomacy", "bibliometrics", "regional integration"]),
    JSON.stringify(["Social Network Analysis", "Triple Helix & Innovation Studies"]),
    "Dear Editor-in-Chief,\n\nWe are pleased to submit our bibliometric study of ASEAN–Northeast Asian research collaboration. Recommended reviewers with reasons are provided.\n\nMina Seo",
    recReviewers,
    "accepted",
    userIds["author@jcea.demo"],
    userIds["eic@jcea.demo"],
    1, 1, 1,
    checklist,
    "National Research Foundation of Korea (NRF-2025-S1A5)",
    1,
    "2026-04-10 10:00:00"
  ).lastInsertRowid
);
insertMsAuthor.run(ms3Id, "Mina Seo", "author@jcea.demo", "Seoul National University", "South Korea", 1, 0);
insertMsAuthor.run(ms3Id, "Rizal Hakim", "", "Universitas Indonesia", "Indonesia", 0, 1);
{
  const pdf = makePdf(
    ms3Id,
    "Mapping Cross-Border Knowledge Networks: Co-Authorship between ASEAN and Northeast Asian Universities, 2010-2025",
    "Scientific collaboration between Southeast and Northeast Asia has intensified but remains unevenly mapped...",
    ["co-authorship networks", "science diplomacy"]
  );
  insertFile.run(ms3Id, "manuscript", "seo-hakim-knowledge-networks.pdf", pdf, fs.statSync(pdf).size, 1, userIds["author@jcea.demo"]);
}
insertEvent.run(ms3Id, userIds["author@jcea.demo"], "submitted", "Manuscript JCEA-2026-0003 submitted", 1, "2026-04-10 10:00:00");
insertEvent.run(ms3Id, userIds["eic@jcea.demo"], "status_change", "Manuscript moved to Under Review", 1, "2026-04-14 09:00:00");
const a3 = Number(
  insertAssignment.run(
    ms3Id, userIds["reviewer1@jcea.demo"], "Grace Lim", "reviewer1@jcea.demo",
    "Nanyang Technological University", "intuitionist", "completed", 1,
    "2026-05-05", "2026-04-14 09:05:00", "2026-04-15 10:00:00", "2026-05-02 12:00:00"
  ).lastInsertRowid
);
const a4 = Number(
  insertAssignment.run(
    ms3Id, userIds["reviewer2@jcea.demo"], "Thomas Berger", "reviewer2@jcea.demo",
    "Freie Universität Berlin", "manual", "completed", 1,
    "2026-05-05", "2026-04-14 09:06:00", "2026-04-16 08:00:00", "2026-05-04 18:20:00"
  ).lastInsertRowid
);
insertReview.run(
  a3, ms3Id, 1, "accept",
  "An excellent, comprehensive bibliometric study. The multipolar-shift finding is important and well supported.",
  "Minor: report modularity scores for the community detection solutions.",
  "Strongly recommend acceptance.",
  5, 5, 5, 4,
  "2026-05-02 12:00:00"
);
insertReview.run(
  a4, ms3Id, 1, "minor_revision",
  "Rigorous and valuable. The gravity model specification should include a robustness check with PPML estimation; otherwise ready.",
  "Methods: add PPML robustness check.\nDiscussion: briefly address COVID-era disruptions.",
  "Solid contribution, minor statistical additions only.",
  4, 5, 5, 5,
  "2026-05-04 18:20:00"
);
insertDecision.run(
  ms3Id, 1, "accept",
  "Dear Dr. Seo,\n\nWe are pleased to accept your manuscript for publication in JCEA. Both reviewers praised the rigor and significance of the study. Please address the minor statistical additions during copy-editing.\n\nHan Woo Park\nEditor-in-Chief",
  userIds["eic@jcea.demo"], "2026-05-20 15:00:00"
);
insertEvent.run(ms3Id, userIds["eic@jcea.demo"], "decision", "Editorial decision (round 1): Accept", 1, "2026-05-20 15:00:00");

// 4) Revision requested
const ms4Id = Number(
  insertMs.run(
    "JCEA-2026-0004",
    "Smart Villages or Digital Divides? Rural Broadband Policy and Community Media in Northeast Thailand",
    "Thailand's Village Broadband Internet Project (Net Pracharat) promised universal connectivity, yet uptake in the rural Northeast remains uneven. Combining a survey of 1,100 households in Isan with interviews at 18 community media centers, this study examines how rural residents translate connectivity into civic and economic practice. We find that community media intermediaries — rather than infrastructure alone — determine whether broadband access converts into meaningful use, supporting an intermediation model of rural digital inclusion in Southeast Asia.",
    JSON.stringify(["digital divide", "Thailand", "rural broadband", "community media", "digital inclusion"]),
    JSON.stringify(["Society & Culture", "Media & Communication"]),
    "Dear Editor-in-Chief,\n\nPlease consider our study of rural broadband and community media in Northeast Thailand. Three recommended reviewers are listed.\n\nKenji Tanaka",
    recReviewers,
    "revision_requested",
    userIds["author2@jcea.demo"],
    userIds["editor.tkach@jcea.demo"],
    0, 1, 1,
    checklist,
    "No funding received",
    1,
    "2026-05-15 08:00:00"
  ).lastInsertRowid
);
insertMsAuthor.run(ms4Id, "Kenji Tanaka", "author2@jcea.demo", "Waseda University", "Japan", 1, 0);
insertMsAuthor.run(ms4Id, "Siriporn Chai", "", "Khon Kaen University", "Thailand", 0, 1);
{
  const pdf = makePdf(
    ms4Id,
    "Smart Villages or Digital Divides? Rural Broadband Policy and Community Media in Northeast Thailand",
    "Thailand's Village Broadband Internet Project promised universal connectivity...",
    ["digital divide", "rural broadband"]
  );
  insertFile.run(ms4Id, "manuscript", "tanaka-chai-smart-villages.pdf", pdf, fs.statSync(pdf).size, 1, userIds["author2@jcea.demo"]);
}
insertEvent.run(ms4Id, userIds["author2@jcea.demo"], "submitted", "Manuscript JCEA-2026-0004 submitted", 1, "2026-05-15 08:00:00");
const a5 = Number(
  insertAssignment.run(
    ms4Id, userIds["reviewer2@jcea.demo"], "Thomas Berger", "reviewer2@jcea.demo",
    "Freie Universität Berlin", "manual", "completed", 1,
    "2026-06-10", "2026-05-18 09:00:00", "2026-05-19 07:30:00", "2026-06-08 13:00:00"
  ).lastInsertRowid
);
insertReview.run(
  a5, ms4Id, 1, "major_revision",
  "The intermediation argument is promising but the survey instrument conflates access with use. The household sampling frame also needs justification. With substantial methodological clarification this could become a strong paper.",
  "Methods: separate access and use constructs; justify sampling frame.\nLit review: engage the community informatics literature.",
  "The core data seem sound but the analysis needs rework before publication.",
  4, 2, 4, 3,
  "2026-06-08 13:00:00"
);
insertDecision.run(
  ms4Id, 1, "major_revision",
  "Dear Dr. Tanaka,\n\nReviewers see promise in your study but require substantial methodological clarification, particularly the separation of access and use constructs. We invite a major revision within 90 days.\n\nLeslie Tkach-Kawasaki\nManaging Editor",
  userIds["editor.tkach@jcea.demo"], "2026-06-15 10:00:00"
);
insertEvent.run(ms4Id, userIds["editor.tkach@jcea.demo"], "decision", "Editorial decision (round 1): Major Revision", 1, "2026-06-15 10:00:00");

// A pending invitation so the demo reviewer persona has an actionable inbox
insertAssignment.run(
  ms1Id, userIds["reviewer2@jcea.demo"], "Thomas Berger", "reviewer2@jcea.demo",
  "Freie Universität Berlin", "manual", "invited", 1,
  "2026-08-15", "2026-07-24 10:00:00", null, null
);

console.log("manuscripts: 4 demo manuscripts (submitted / under review / accepted / revision requested)");
console.log("\nSeed complete.");
console.log(`Database: ${DB_PATH}`);
console.log(`Sign-in accounts (password "${PW}"):`);
for (const [email, name, , , roles] of users) console.log(`  ${email.padEnd(26)} ${roles.padEnd(14)} ${name}`);
db.close();
