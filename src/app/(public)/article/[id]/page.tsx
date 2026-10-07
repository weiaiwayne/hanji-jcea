import { getDb, getSettings, parseJson } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { toAPA } from "@/lib/citation";
import type { ArticleFull } from "@/lib/citation";
import { Breadcrumbs } from "@/components/ui";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink, FileText, Headphones, Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";
import CitationBox from "./CitationBox";

import { api } from "@/lib/basePath";
export const dynamic = "force-dynamic";

interface AiAsset {
  id: number;
  type: string;
  content: string | null;
  file_path: string | null;
}

function loadArticle(id: number) {
  const db = getDb();
  // Only genuinely published articles are public: an article in a draft or
  // in-progress issue must not be reachable by guessing its id.
  const article = db
    .prepare(
      `SELECT a.*, i.volume, i.number, i.year FROM articles a
       JOIN issues i ON i.id = a.issue_id
       WHERE a.id = ? AND a.published_at IS NOT NULL AND i.status = 'published'`
    )
    .get(id) as (ArticleFull & { issue_id: number | null; article_type: string }) | undefined;
  if (!article) return null;
  const assets = db
    .prepare(
      "SELECT id, type, content, file_path FROM ai_assets WHERE article_id = ? AND status = 'approved'"
    )
    .all(id) as AiAsset[];
  return { article, assets };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = loadArticle(Number(id));
  if (!data) return { title: "Article not found" };
  const { article } = data;
  return {
    title: article.title,
    description: article.abstract.slice(0, 200),
    openGraph: {
      title: article.title,
      description: article.abstract.slice(0, 200),
      type: "article",
    },
  };
}

interface SummaryContent {
  overview?: string;
  key_findings?: string[];
  methods?: string;
  implications?: string;
  limitations?: string;
  plain_language_abstract?: string;
}

interface VizItem {
  title: string;
  description: string;
  svg: string;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = loadArticle(Number(id));
  if (!data) notFound();
  const { article, assets } = data;

  const authors = parseJson<{ name: string; affiliation?: string; orcid?: string }[]>(
    article.authors_json,
    []
  );
  const keywords = parseJson<string[]>(article.keywords, []);
  const summaryAsset = assets.find((a) => a.type === "summary");
  const podcastAsset = assets.find((a) => a.type === "podcast");
  const vizAsset = assets.find((a) => a.type === "visualization");
  const summary = summaryAsset
    ? parseJson<SummaryContent>(summaryAsset.content, {})
    : null;
  const vizItems = vizAsset ? parseJson<VizItem[]>(vizAsset.content, []) : [];

  const settings = getSettings();
  const licenseName = settings.license_short || "CC BY-NC-ND 4.0";
  const licenseUrl =
    settings.license_url || "https://creativecommons.org/licenses/by-nc-nd/4.0/";
  const licenseFull = settings.license_name || licenseName;
  const pubYear = article.year || article.published_at?.slice(0, 4);
  const authorNames = (
    authors.length > 0
      ? authors.map((a) => a.name)
      : article.authors_display.split(",").map((n) => n.trim())
  ).filter(Boolean);
  const copyrightHolder =
    authorNames.length === 0
      ? "The Author(s)"
      : authorNames.length === 1
        ? authorNames[0]
        : `${authorNames[0]} et al.`;
  // Book reviews and editor's notes are editorially assessed, not peer reviewed —
  // Principle 8 requires the exceptions to be identifiable per article.
  const articleType = article.article_type || "Research Article";
  const peerReviewed = !/book review|editor.s note|editorial/i.test(articleType);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: article.title,
    abstract: article.abstract,
    author: (authors.length > 0
      ? authors
      : article.authors_display.split(",").map((n) => ({ name: n.trim() }))
    ).map((a) => ({
      "@type": "Person",
      name: a.name,
      ...("affiliation" in a && a.affiliation
        ? { affiliation: { "@type": "Organization", name: a.affiliation } }
        : {}),
    })),
    datePublished: article.published_at?.slice(0, 10),
    keywords: keywords.join(", "),
    isPartOf: {
      "@type": "PublicationIssue",
      issueNumber: article.number,
      isPartOf: {
        "@type": "PublicationVolume",
        volumeNumber: article.volume,
        isPartOf: {
          "@type": "Periodical",
          name: "Journal of Contemporary Eastern Asia",
          issn: "2383-9449",
        },
      },
    },
    ...(article.doi ? { sameAs: `https://doi.org/${article.doi}` } : {}),
    license: licenseUrl,
    copyrightYear: pubYear,
    copyrightHolder: authorNames.map((name) => ({ "@type": "Person", name })),
    isAccessibleForFree: true,
    creativeWorkStatus: "Published",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(article.volume
            ? [
                {
                  label: `Vol. ${article.volume}, No. ${article.number}`,
                  href: `/issue/${article.issue_id}`,
                },
              ]
            : []),
          { label: "Article" },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <article>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-600">
            {articleType}
            {article.volume
              ? ` · Vol. ${article.volume}, No. ${article.number} (${article.year})`
              : ""}
            {article.pages ? ` · pp. ${article.pages}` : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {peerReviewed ? (
              <>
                Peer reviewed — at least two external reviewers, single-anonymised.{" "}
              </>
            ) : (
              <>Editorially assessed; not externally peer reviewed. </>
            )}
            <Link href="/editorial-process" className="text-teal-600 hover:underline">
              Editorial process
            </Link>
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-primary-900">
            {article.title}
          </h1>

          <ul className="mt-4 space-y-1">
            {(authors.length > 0
              ? authors
              : article.authors_display
                  .split(",")
                  .map((n) => ({ name: n.trim(), affiliation: "", orcid: "" }))
            ).map((a, i) => (
              <li key={i} className="text-gray-700">
                <span className="font-medium">{a.name}</span>
                {a.affiliation && (
                  <span className="text-gray-500"> — {a.affiliation}</span>
                )}
                {a.orcid && (
                  <a
                    href={`https://orcid.org/${a.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-teal-600 hover:underline"
                  >
                    ORCID
                  </a>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-sm text-gray-500">
            Published {fmtDate(article.published_at)}
            {article.doi && (
              <>
                {" · "}
                <a
                  href={`https://doi.org/${article.doi}`}
                  className="text-primary-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://doi.org/{article.doi}
                </a>
              </>
            )}
          </p>

          <section
            className="mt-8"
            aria-labelledby={article.abstract?.trim() ? "abstract-heading" : undefined}
          >
            {article.abstract?.trim() && (
              <>
                <h2 id="abstract-heading" className="text-lg font-bold text-primary-800">
                  Abstract
                </h2>
                <p className="prose-jcea mt-2">{article.abstract}</p>
              </>
            )}
            {keywords.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-1.5">
                <span className="mr-1 text-sm font-medium text-gray-600">Keywords:</span>
                {keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs text-primary-700"
                  >
                    {k}
                  </span>
                ))}
              </p>
            )}
          </section>

          {summary && (
            <section
              className="mt-10 rounded-xl border border-teal-100 bg-teal-50/50 p-6"
              aria-labelledby="ai-summary-heading"
            >
              <h2
                id="ai-summary-heading"
                className="flex items-center gap-2 text-lg font-bold text-teal-700"
              >
                <Sparkles className="h-5 w-5" aria-hidden="true" /> AI Plain-Language Summary
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Generated with author consent and approved by the editorial team.
                The peer-reviewed article remains the authoritative source.
              </p>
              {summary.plain_language_abstract && (
                <p className="prose-jcea mt-4 font-medium">{summary.plain_language_abstract}</p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {summary.overview && (
                  <div>
                    <h3 className="text-sm font-semibold text-teal-700">Overview</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">{summary.overview}</p>
                  </div>
                )}
                {summary.methods && (
                  <div>
                    <h3 className="text-sm font-semibold text-teal-700">Methods</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">{summary.methods}</p>
                  </div>
                )}
                {summary.implications && (
                  <div>
                    <h3 className="text-sm font-semibold text-teal-700">Implications</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">{summary.implications}</p>
                  </div>
                )}
                {summary.limitations && (
                  <div>
                    <h3 className="text-sm font-semibold text-teal-700">Limitations</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">{summary.limitations}</p>
                  </div>
                )}
              </div>
              {summary.key_findings && summary.key_findings.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-teal-700">Key Findings</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {summary.key_findings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {podcastAsset?.file_path && (
            <section
              className="mt-10 rounded-xl border border-primary-100 bg-primary-50/50 p-6"
              aria-labelledby="podcast-heading"
            >
              <h2
                id="podcast-heading"
                className="flex items-center gap-2 text-lg font-bold text-primary-800"
              >
                <Headphones className="h-5 w-5" aria-hidden="true" /> AI Audio Summary
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                An AI-narrated overview of this article, generated with author consent.
              </p>
              <audio
                controls
                preload="none"
                className="mt-4 w-full"
                src={api(`/api/ai-assets/${podcastAsset.id}/audio`)}
              >
                Your browser does not support the audio element.
              </audio>
            </section>
          )}

          {vizItems.length > 0 && (
            <section className="mt-10" aria-labelledby="viz-heading">
              <h2
                id="viz-heading"
                className="flex items-center gap-2 text-lg font-bold text-primary-800"
              >
                <BarChart3 className="h-5 w-5" aria-hidden="true" /> AI-Generated Visualizations
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Automatically derived from the article text with author consent.
              </p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {vizItems.map((v, i) => (
                  <figure
                    key={i}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div
                      className="[&_svg]:h-auto [&_svg]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: v.svg }}
                    />
                    <figcaption className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">{v.title}.</span>{" "}
                      {v.description}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Access
            </h2>
            {article.pdf_url || article.koreascience_url ? (
              <a
                href={article.pdf_url || article.koreascience_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Full Text on KoreaScience
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Full text link pending.</p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              Open access — free to read, with no subscription, registration or
              pay-per-view charge. The version of record is hosted on
              KoreaScience and preserved by{" "}
              <Link href="/archiving-and-preservation" className="text-teal-600 hover:underline">
                NDSL/KISTI
              </Link>
              .
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
              Copyright &amp; licence
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-gray-600">
              © {pubYear} {copyrightHolder}
              {copyrightHolder.endsWith(".") ? "" : "."} The author(s) retain
              copyright.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Published by the Journal of Contemporary Eastern Asia under the{" "}
              <a
                href={licenseUrl}
                target="_blank"
                rel="license noopener noreferrer"
                className="text-teal-600 underline underline-offset-2 hover:text-teal-700"
              >
                {licenseFull}
              </a>{" "}
              licence — free to copy and redistribute with attribution, not for
              commercial use, no derivatives.
            </p>
            <p className="mt-2 text-xs">
              <Link href="/copyright" className="text-teal-600 hover:underline">
                Full copyright and self-archiving terms
              </Link>
            </p>
          </div>
          <CitationBox articleId={article.id} apa={toAPA(article)} />
        </aside>
      </div>
    </div>
  );
}
