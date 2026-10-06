# DOAJ transparency compliance — what changed, what the editors must decide, what to file

JCEA (eISSN 2383-9449) is indexed in DOAJ and must satisfy the
[16 Principles of Transparency and Best Practice in Scholarly Publishing](https://doaj.org/apply/transparency/).
This documents the September 2026 pass over the public site.

DOAJ's record for the journal was last fully reviewed **2020-03-05** and several of its fields now
contradict the website. Fixing the site is only half the job — §3 below is the other half.

---

## 1. What changed on the site

**New pages** (`seed-content/doaj-policies.json`, route files under `src/app/(public)/`):

| Page | Principles |
|---|---|
| `/publication-ethics` — Publication Ethics and Malpractice Statement | 7 (all nine required topics), plus authorship criteria and the AI policy |
| `/author-fees` — Author Fees, Waivers and Business Model | 13, 14, 15, 16 |
| `/archiving-and-preservation` — Archiving and Digital Preservation | 4 |

**Rewritten pages:** `/editorial-process`, `/copyright`, `/submission`, `/about-journal`,
`/abstracting-indexing`, `/contact`.

**Code:** a "Policies" group in the header and footer nav; licence name and URL, APC summary and
publication frequency now render from `site_settings` instead of being hardcoded in three places;
article pages carry a copyright line, a clickable licence, and a peer-reviewed / editorially-assessed
label; JSON-LD carries `license`, `copyrightHolder` and `isAccessibleForFree`; DOI deposit metadata
in `src/lib/koreascience.ts` moved to CC BY-NC-ND 4.0; the editorial board page states when the
board was last reviewed.

**Licence:** standardised on **CC BY-NC-ND 4.0** everywhere. The site previously said three
different things — CC BY-NC-ND 3.0 on `/copyright`, "Attribution-No Derivative Works" (i.e. CC BY-ND,
no NonCommercial clause) on `/submission`, and 3.0 in the footer and DOI metadata.

To re-apply the content after a database change: `npx tsx scripts/doaj-content-update.ts`
(idempotent; touches only `cms_pages` and `site_settings`). `scripts/seed.ts` applies the same pack,
so a fresh seed and an updated database match.

---

## 2. Decisions the editorial office needs to confirm

The new pages state the journal's practice as documented in the existing site, the old
`jceasia.org` pages, and the DOAJ record. These points went beyond what any of those sources
stated and need an editor to confirm or correct — each is a single edit in Admin → Website Pages.

1. **Advertising** (`/author-fees`). The page states *"JCEA does not accept advertising."* No
   advertisement appears on either site, but this was never written down. Confirm.
2. **Hardship waivers** (`/author-fees`). DOAJ's record says `has_waiver: false`; the site's only
   exemptions are for Associate Editors and invited scholars. The page now invites authors in
   genuine difficulty to write to the editorial office before submitting, decided by the
   Editor-in-Chief. **Confirm that such requests will in fact be considered** — if not, that
   paragraph must come out, and DOAJ's `has_waiver: false` stays as is. If it stays, DOAJ needs
   updating.
3. **Turnaround figures** (`/editorial-process`). The page publishes the targets already stated on
   the site (2-week reviews, ~2 months to first decision) and the 14-week submission-to-publication
   average **from the journal's own DOAJ record**. Principle 8 requires timeframe claims to be
   supported by published data. If the real figures differ, correct both the page and DOAJ.
4. **Appeal and complaint response times** (`/publication-ethics`). Stated as acknowledgement
   within one week and an outcome within eight weeks. These are commitments; adjust if unrealistic.
5. **Data sharing** (`/publication-ethics`). Written as *encouraged but not required*, with data
   retention for five years. Confirm this is the intended position rather than a mandate.
6. **Preservation** (`/archiving-and-preservation`). NDSL/KISTI is taken from the DOAJ record.
   Confirm the deposit is still live and covers the full run, including pre-2012 back content.
7. **Print ISSN.** The old pages claimed first publication *"in print and online"*, but only
   eISSN 2383-9449 exists. Principle 2 requires separate ISSNs per medium. The new pages describe
   the journal as online-only and the print claim has been removed. If a print edition genuinely
   exists, register a print ISSN and tell us.
8. **Publisher identity.** `/about-journal` and `/contact` now name both publishers with links —
   the Cyber Emotions Research Center at Yeungnam University and WATEF. DOAJ lists WATEF alone and
   the old homepage said "Yeungnam University Press". Settle on one form and use it everywhere.
9. **Editorial board currency** (`/editorial-board`). Shows "Last reviewed: September 2026" from
   the `board_reviewed` setting. Principle 11 requires the list to be current and members to have
   agreed to serve — update the date when the board is actually reviewed, not before.

---

## 3. DOAJ update request — file this

DOAJ treats its own record as the journal's claim. These fields currently contradict the website:

| Field | DOAJ record says | Should say |
|---|---|---|
| `apc.has_apc` | `false` | **`true`** — USD 100, plus a USD 200 supplement for funded research |
| `other_charges.has_other_charges` | `false` | **`true`** — language-editing charges, disclosed in advance |
| `plagiarism.detection` | `false` | **`true`** — iThenticate, plus an author-supplied originality report |
| `deposit_policy.has_policy` | `false` | **`true`** — self-archiving policy now published at `/copyright` |
| `waiver.has_waiver` | `false` | per decision 2 above |
| `license` | CC BY-NC-ND (3.0) | **CC BY-NC-ND 4.0** |
| `publication_time_weeks` | `14` | confirm or correct (decision 3) |
| `publisher.name` | WATEF only | both publishers (decision 8) |

**`has_apc: false` is the most serious item here.** A journal that charges an article processing
charge while its DOAJ record says it charges none is exactly the discrepancy that triggers a
review. This has been the state of the record since 2020.

**URLs.** DOAJ stores `jceasia.org/about-journal`, `/editorial-board`, `/editorial-process`,
`/copyright` and `/submission`. All five slugs are preserved in this build, so they keep working
when it is ported onto `jceasia.org`. If the journal moves to a different domain instead, every
one of these URLs must be updated in DOAJ and `jceasia.org` must serve 301 redirects.

**Also worth adding while the record is open:** `/publication-ethics`, `/author-fees` and
`/archiving-and-preservation` map onto DOAJ fields that are currently empty.

---

## 4. KoreaScience / KISTI

Principle 5 requires the copyright holder to be named on **all published articles, HTML and PDF**,
and Principle 6 requires the licence terms on the full text. The article landing pages here now
carry both. The PDFs are produced and hosted by KoreaScience and are outside this repository —
**confirm with KISTI that the deposited PDFs carry the copyright line and the CC BY-NC-ND 4.0
statement.** `src/lib/koreascience.ts` controls the metadata this system sends, and now sends 4.0.

---

## 5. Before this replaces jceasia.org

- `src/app/layout.tsx` — remove the amber "Test environment … not the official website of the
  Journal of Contemporary Eastern Asia" banner, and change `robots: { index: false, follow: false }`
  to indexable. A DOAJ reviewer landing on a live site that says it is not the official site is a
  Principle 2 failure in itself.
- Confirm the five DOAJ-referenced slugs resolve on the new host.
- Re-run the checks in §7 of the plan against the production domain.

---

## 6. `jceasia.org` — fix these on the old site now

The old site is authoritative until the port, and every DOAJ URL points at it. It is hosted
elsewhere and was not edited as part of this work. In priority order:

1. **`/copyright` states the wrong licence.** It says "Creative Commons Attribution-No Derivative
   Works 3.0" — CC BY-**ND**, with no NonCommercial clause — while DOAJ's record and every other
   statement say CC BY-**NC**-ND. That is a substantive difference in the rights granted to
   readers, and it is the single most important fix on the old site.
2. **No article processing charge is mentioned on `/about-journal`.** Fees appear only on
   `/submission`. Principle 13 wants fee information easy to find and presented early. Add a fee
   line to `/about-journal` and to the homepage.
3. **No archiving or preservation statement anywhere** (Principle 4). `/abstracting-indexing` lists
   Scopus, EBSCO and Google Scholar and stops. Add the NDSL/KISTI preservation sentence — DOAJ
   already has it on file, so the site is the only thing out of step — and add DOAJ to the
   indexing list, which the page omits although the record claims it.
4. **No ethics, appeals, corrections/retractions, advertising or revenue statements** (Principles
   7, 14, 15, 16). If only one page can be added to the old site, make it a Publication Ethics page
   covering the Principle 7 topics; the text at `/publication-ethics` in this build can be reused.
5. **The publisher is named three different ways** — "Yeungnam University Press" on the homepage,
   CERC + Asia Triple Helix Society on `/about-journal`, WATEF alone in DOAJ (Principle 10).
6. **`/editorial-process` on the old site is better than the new one was.** It carries the
   iThenticate screening statement and "The Editor-in-Chief is responsible for the academic quality
   of the publication process", both of which had been dropped in the port. Both are now restored
   here — nothing to fix on the old site.
7. HTTPS with an HTTP→HTTPS 301 is already correct on both hosts (Principle 2 satisfied).
