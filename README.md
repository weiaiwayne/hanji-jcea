# JCEA AI-Enhanced Editorial System (Claude build)

A full-stack editorial management system for the **Journal of Contemporary Eastern Asia** (ISSN 2383-9449): public journal website, author portal, editorial dashboard with AI reviewer finding (Intuitionist), reviewer portal, admin CMS, and AI companion-content pipelines (podcasts, plain-language summaries, visualizations).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript), single app serving frontend + API routes |
| Database | SQLite via better-sqlite3 (`data/jcea.db`, WAL mode) — schema in `src/lib/schema.sql` |
| Auth | Custom JWT sessions (jose, HS256) in httpOnly cookies, bcryptjs password hashing, role-based access (author / reviewer / editor / eic / admin) |
| Styling | Tailwind CSS v4 — serif body (Source Serif 4) + sans UI (Inter), WCAG 2.1 AA (skip links, focus rings, aria labels, keyboard-navigable) |
| Files | Local filesystem under `/root/hanji/uploads/claude/` |
| AI summaries & podcast scripts | Local Ollama (`mistral:7b` by default, configurable in Site Settings) |
| Podcast audio | edge-tts (Python venv at `.venv/`), single narrator, MP3 |
| PDF text extraction | pdfplumber (pypdf fallback) via `scripts/py/extract_pdf.py` |
| Visualizations | Server-generated self-contained SVGs (keyword co-occurrence network, term frequency chart, cited-literature timeline) — no client chart library |

## Run it

```bash
cd /root/hanji/claude
npm install
python3 -m venv --system-site-packages .venv && .venv/bin/pip install edge-tts fpdf2

npx tsx scripts/seed.ts          # seed DB (add --reset to wipe and reseed)
npx tsx scripts/doaj-content-update.ts   # re-apply the DOAJ policy pages/settings in place (idempotent)
npm run dev                      # development on :3000
# or production:
npm run build && PORT=3457 npm start
```

Environment (`.env`): `SESSION_SECRET`, `NEXT_PUBLIC_BASE_PATH` (e.g. `/jcea` — bake into the build for sub-path deployment), `OLLAMA_URL`, `OLLAMA_MODEL`, `INTUITIONIST_URL`, `UPLOADS_DIR`.

**Health check:** `GET /api/health` — verifies database, the Intuitionist API (localhost:3848), and Ollama; returns 503 if a critical dependency is down.

## Demo mode (no sign-in required)

The login page offers one-click **"Explore as Author / Editor-in-Chief / Reviewer / Admin"** buttons that sign visitors into the seeded demo personas — so the submission, reviewer-selection, and review flows can be experienced without registering. This is for the test deployment only: set `demo_mode` to `no` in Admin → Site Settings (or in the seed) to require real accounts, as a production installation would.

## Demo accounts (password for all: `jcea-demo-2026`)

> **Live site (hanji.lampbotics.com/jcea):** all demo accounts are deactivated (`users.active = 0`) and `demo_mode` is `no` since October 2026. They exist only in a fresh local seed. Before re-enabling the editorial system in production, create real accounts — do not reactivate these.

| Email | Role |
|---|---|
| admin@jcea.demo | admin (implicitly all roles) |
| eic@jcea.demo | Editor-in-Chief |
| editor.zhang@jcea.demo, editor.tkach@jcea.demo, editor.xu@jcea.demo | editors |
| author@jcea.demo, author2@jcea.demo | authors |
| reviewer1@jcea.demo, reviewer2@jcea.demo | reviewers |

Seeded: 50 real editorial board members and 12 CMS pages (9 scraped from jceasia.org, then the DOAJ transparency pack in `seed-content/doaj-policies.json` rewrites six of them and adds Publication Ethics, Author Fees and Archiving — see [DOAJ-COMPLIANCE-NOTES.md](DOAJ-COMPLIANCE-NOTES.md)), site settings (APC, contacts, licence), 3 published demo issues with 11 demo articles, and 4 demo manuscripts covering the workflow (submitted → under review → revision requested → accepted). Manuscript `JCEA-2026-0003` is accepted with all three AI consents for pipeline demos. Demo articles are seed/test content; DOIs are tracked as "prepared" pending KoreaScience registration.

## Feature map

- **Public site** — home (current-issue highlight, latest articles, news), About, Editorial Board (filterable by role/country/search), Editorial Process, Current Issue, Past Issues archive (browse + search), article pages (metadata, JSON-LD ScholarlyArticle, Open Graph, citation export in APA/BibTeX/RIS, KoreaScience full-text links, approved AI summary/podcast/visualizations), Best Paper, Abstracting & Indexing, Copyright, Contact, CFP, Conference, and the DOAJ transparency policy pages (Publication Ethics, Author Fees & Business Model, Archiving & Preservation). All content pages are CMS-editable.
- **DOAJ transparency compliance** — the public site is written against the [16 Principles of Transparency and Best Practice in Scholarly Publishing](https://doaj.org/apply/transparency/). Policy copy lives in `seed-content/doaj-policies.json`; licence name/URL, APC summary and publication frequency render from `site_settings` so they cannot drift between pages. Open editorial questions, the DOAJ record-update brief, and the fix list for the legacy jceasia.org site are in [DOAJ-COMPLIANCE-NOTES.md](DOAJ-COMPLIANCE-NOTES.md).
- **Author portal** — dashboard with action-needed callouts; 5-step submission wizard (metadata → authors → cover letter with **enforced 3 recommended reviewers** → PDF/supplementary upload → checklist + **opt-in, unchecked AI consent toggles**); submission detail with status timeline, blinded review progress, decision letters, revision upload; per-submission AI consent management.
- **Editorial dashboard** (editor/eic) — filterable/sortable manuscript queue with days-in-review; unblinded manuscript detail; handling-editor assignment; **Intuitionist reviewer finder** (see below); manual reviewer invitation (auto-provisions reviewer accounts); invitation status tracking; decision recording (accept / minor / major / reject) with 2-reviewer minimum warning; issue creation and assignment of accepted manuscripts.
- **Reviewer portal** — assignment dashboard with due dates and overdue flags; accept/decline invitations; structured review form (recommendation, general/section/confidential comments, 1–5 scores for novelty/rigor/significance/clarity, annotated-PDF upload, **mandatory conflict-of-interest declaration**); draft saving.
- **Admin CMS** — overview with service health; rich-text page editor; issue publishing with **KoreaScience DOI workflow** (per-article DOI/status/URL editing, XML + JSON deposit metadata export per article or per issue); editorial board CRUD; **AI content management** (global toggle, generate/regenerate, preview, approve/reject/unpublish — nothing goes public without approval); user role/password/activation management; site settings.

## Intuitionist reviewer finder integration

- `src/lib/intuitionist.ts` calls the running Flask API at `http://localhost:3848/api/intuitionist/` — `POST find-reviewers` (fast mode) or `find-reviewers-with-expansion` (full mode with corpus-gap expansion), payload `{abstract, num_reviewers, fast_mode}`. The server, its database, and `/root/agentacademy/` are never modified.
- Results are post-processed against **JCEA editorial rules** before display:
  - **5-year co-authorship check**: candidate is matched (OpenAlex ID, then name) in a *read-only* connection to the Intuitionist corpus; their co-authors since `now − 5y` are name-matched against the manuscript authors.
  - **Recently invited for JCEA**: name-matched against `reviewer_assignments` from the last 12 months.
  - Same-institution and manuscript-author checks; cited-author flag passed through as advisory.
  - **PhD unverifiable** — every card carries an "editor must confirm" notice.
  - Minimum-2-reviewers rule enforced with queue warnings and a decision-time confirm.
- The editorial UI shows ranked cards with composite-score bars, embedding similarity, h-index, paper counts, seniority tier badges (emerging / mid-career / senior), top relevant papers, ORCID links, and conflict flags (blocking conflicts require "Assign anyway"), with filters for seniority, institution, and conflict status. Assigning snapshots the full candidate JSON into the assignment record.

## AI pipelines (`src/lib/ai/`)

All AI content requires (1) explicit per-submission author consent (opt-in, never pre-checked), (2) accepted/published status, (3) editorial approval before public display. Generation runs asynchronously; status is tracked in `ai_assets` (pending → generating → generated → approved/rejected, or failed with the error stored).

1. **Text**: latest manuscript PDF → pdfplumber extraction (abstract fallback).
2. **Summary**: Ollama → structured JSON (overview, key findings, methods, implications, limitations, plain-language abstract).
3. **Podcast**: Ollama script (~5–6 min narration) → edge-tts MP3, streamed via `/api/ai-assets/[id]/audio`.
4. **Visualizations**: deterministic SVG generation from the text (keyword co-occurrence network, term frequency bars, cited-literature-by-year chart).

## KoreaScience / DOI

Articles remain hosted on KoreaScience: the system stores landing/PDF URLs and links out rather than serving article PDFs. On acceptance + issue assignment an article record is created; admin tracks DOI status (none → prepared → registered) and exports KoreaScience-compatible deposit metadata as XML or JSON (per article or whole issue), including ISSN 2383-9449, CC BY-NC-ND 3.0 license, ORCIDs, and full contributor lists.

## Deployment (hanji.lampbotics.com/jcea)

Built with `NEXT_PUBLIC_BASE_PATH=/jcea` (Next.js `basePath`; all internal fetch/href URLs go through `src/lib/basePath.ts`). Runs as a systemd service (`jcea-claude.service`) on port 3457 behind nginx (`/etc/nginx/sites-available/hanji.lampbotics.com`), which proxies `/jcea` to the app (the old `/fable5` path 301-redirects to `/jcea`).

## Project layout

```
src/lib/          schema.sql, db.ts, auth.ts, intuitionist.ts, koreascience.ts,
                  citation.ts, files.ts, basePath.ts, ai/{ollama,pipeline,viz}.ts
src/app/(public)  public website     src/app/author     author portal
src/app/editorial editorial portal   src/app/reviewer   reviewer portal
src/app/admin     admin CMS          src/app/api        ~30 REST route handlers
scripts/          seed.ts, apply-basepath.mjs, py/{extract_pdf,make_demo_pdf}.py
seed-content/     jcea-content.json (scraped from jceasia.org)
data/             SQLite database (created on first run)
```
