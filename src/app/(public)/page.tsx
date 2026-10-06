import Link from "next/link";
import { getDb, getSettings, parseJson } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";
import { withBasePath } from "@/components/CmsContent";
import { ArrowRight, BookOpen, FileText, Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

interface ArticleRow {
  id: number;
  title: string;
  authors_display: string;
  doi: string;
  keywords: string;
  published_at: string;
  volume?: number;
  number?: number;
}

export default function HomePage() {
  const db = getDb();
  const settings = getSettings();

  const currentIssue = db
    .prepare(
      "SELECT * FROM issues WHERE status = 'published' ORDER BY year DESC, volume DESC, number DESC LIMIT 1"
    )
    .get() as { id: number; volume: number; number: number; year: number; title: string; published_at: string } | undefined;

  const issueArticles: ArticleRow[] = currentIssue
    ? (db
        .prepare(
          "SELECT * FROM articles WHERE issue_id = ? AND published_at IS NOT NULL ORDER BY order_in_issue LIMIT 6"
        )
        .all(currentIssue.id) as ArticleRow[])
    : [];

  const latest = db
    .prepare(
      `SELECT a.*, i.volume, i.number FROM articles a JOIN issues i ON i.id = a.issue_id
       WHERE a.published_at IS NOT NULL AND i.status = 'published' ORDER BY a.published_at DESC LIMIT 5`
    )
    .all() as ArticleRow[];

  const news = db
    .prepare("SELECT * FROM news WHERE published = 1 ORDER BY published_at DESC LIMIT 4")
    .all() as { id: number; title: string; body: string; published_at: string }[];

  return (
    <>
      {/* Hero */}
      <section className="hero-network text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[3fr_2fr] lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-medium tracking-wide text-primary-100">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Open Access · Refereed · {settings.frequency || "Biannual (June and December)"} · ISSN{" "}
              {settings.issn || "2383-9449"}
            </p>
            <h1 className="font-serif text-[2.6rem] font-bold leading-[1.08] tracking-tight sm:text-[3.4rem]">
              Journal of{" "}
              <span className="text-accent-400">Contemporary</span>{" "}
              Eastern Asia
            </h1>
            <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-primary-100/90">
              Rigorous research on political, social, and economic trends in
              East and Southeast Asia — Internet research, Triple Helix studies,
              social network analysis, and cyber communication.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={EDITORIAL_SYSTEM_ENABLED ? "/author" : "/submission"}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-accent-400 to-accent-500 px-5 py-2.5 text-sm font-bold text-primary-950 shadow-lg shadow-accent-600/20 ring-1 ring-accent-600/50 transition-all hover:from-accent-400 hover:to-accent-400 active:translate-y-px"
              >
                {EDITORIAL_SYSTEM_ENABLED ? "Submit a Manuscript" : "Submission Guidelines"}{" "}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/current-issue"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" /> Current Issue
              </Link>
            </div>
            <p className="mt-7 text-sm text-primary-200">
              Indexed in Scopus, DOAJ, EBSCOhost, and Google Scholar · Member of COPE ·
              Articles licensed{" "}
              <a
                className="underline underline-offset-4"
                href={settings.license_url || "https://creativecommons.org/licenses/by-nc-nd/4.0/"}
                target="_blank"
                rel="license noopener noreferrer"
              >
                {settings.license_short || "CC BY-NC-ND 4.0"}
              </a>
            </p>
            {EDITORIAL_SYSTEM_ENABLED && (
              <p className="mt-2.5 text-sm text-primary-200">
                Curious about the editorial workflow?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-accent-400 underline decoration-accent-400/50 underline-offset-4 hover:text-accent-100"
                >
                  Try the demo
                </Link>{" "}
                as an author, editor, or reviewer — no account needed.
              </p>
            )}
          </div>

          {/* Current issue card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-6 shadow-[var(--shadow-pop)] backdrop-blur">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-teal-500 to-accent-500"
            />
            <p className="eyebrow !text-accent-400">Current Issue</p>
            {currentIssue ? (
              <>
                <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight">
                  Vol. {currentIssue.volume} · No. {currentIssue.number}
                  <span className="ml-2 text-base font-normal text-primary-200">
                    ({currentIssue.year})
                  </span>
                </h2>
                {currentIssue.title && (
                  <p className="mt-1 text-sm text-primary-100">{currentIssue.title}</p>
                )}
                <ul className="mt-5 space-y-3.5">
                  {issueArticles.slice(0, 4).map((a) => (
                    <li key={a.id} className="group border-l-2 border-teal-500/70 pl-3.5 transition-colors hover:border-accent-400">
                      <Link
                        href={`/article/${a.id}`}
                        className="font-serif text-[0.95rem] font-semibold leading-snug text-white group-hover:underline underline-offset-2"
                      >
                        {a.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-primary-200">{a.authors_display}</p>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/current-issue"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 transition-colors hover:text-accent-100"
                >
                  Full table of contents <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-primary-100">
                The next issue is in preparation. Browse the{" "}
                <Link href="/archive" className="underline hover:text-white">
                  archive
                </Link>{" "}
                in the meantime.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Latest articles + news */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[3fr_2fr]">
        <div>
          <p className="eyebrow">Recently Published</p>
          <h2 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-primary-900">
            <FileText className="h-5 w-5 text-teal-600" aria-hidden="true" /> Latest Articles
          </h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {latest.length === 0 && (
              <li className="py-6 text-sm text-gray-500">
                Published articles will appear here.
              </li>
            )}
            {latest.map((a) => (
              <li key={a.id} className="group -mx-3 rounded-xl px-3 py-4 transition-colors hover:bg-primary-50/50">
                <Link
                  href={`/article/${a.id}`}
                  className="font-serif text-lg font-semibold leading-snug text-primary-900 underline-offset-2 group-hover:text-teal-700 group-hover:underline"
                >
                  {a.title}
                </Link>
                <p className="mt-1 text-sm text-gray-600">{a.authors_display}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {a.volume ? `Vol. ${a.volume}, No. ${a.number} · ` : ""}
                  {fmtDate(a.published_at)}
                  {a.doi && (
                    <>
                      {" · "}
                      <span className="text-primary-600">doi:{a.doi}</span>
                    </>
                  )}
                </p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {parseJson<string[]>(a.keywords, []).slice(0, 4).map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 ring-1 ring-primary-100"
                    >
                      {k}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/archive"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition-colors hover:text-teal-700 hover:underline underline-offset-4"
          >
            Browse all issues <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <aside>
          <p className="eyebrow !text-accent-600">From the Editorial Office</p>
          <h2 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-primary-900">
            <Megaphone className="h-5 w-5 text-accent-600" aria-hidden="true" /> News &amp; Announcements
          </h2>
          <ul className="mt-4 space-y-4">
            {news.length === 0 && (
              <li className="text-sm text-gray-500">No announcements at the moment.</li>
            )}
            {news.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                <p className="text-xs font-medium text-gray-400">{fmtDate(n.published_at)}</p>
                <h3 className="mt-1 font-serif text-[1.02rem] font-bold leading-snug text-gray-900">
                  {n.title}
                </h3>
                <div
                  className="prose-jcea mt-1.5 text-sm [&_p]:mb-1"
                  dangerouslySetInnerHTML={{ __html: withBasePath(n.body) }}
                />
              </li>
            ))}
          </ul>

          <div className="relative mt-8 overflow-hidden rounded-xl bg-teal-50 p-5 ring-1 ring-teal-100">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-teal-500" />
            <h3 className="font-serif text-base font-bold text-teal-800">For Authors</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
              {settings.apc_summary ||
                "No submission fees. An article processing charge of USD 100 (KRW 150,000) is payable on acceptance; USD 300 (KRW 450,000) in total where the research was funded."}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
              <Link href="/submission" className="text-teal-700 underline-offset-4 hover:underline">
                Guidelines
              </Link>
              <Link href="/author-fees" className="text-teal-700 underline-offset-4 hover:underline">
                Fees &amp; waivers
              </Link>
              <Link href="/call-for-papers" className="text-teal-700 underline-offset-4 hover:underline">
                Call for Papers
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
