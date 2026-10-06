import Link from "next/link";
import { parseJson } from "@/lib/db";
import { ExternalLink, FileText } from "lucide-react";

export interface ArticleListRow {
  id: number;
  title: string;
  authors_display: string;
  abstract: string;
  keywords: string;
  pages: string;
  doi: string;
  koreascience_url: string;
  pdf_url: string;
  article_type: string;
}

export default function ArticleListItem({ article }: { article: ArticleListRow }) {
  return (
    <li className="group -mx-3 rounded-xl px-3 py-5 transition-colors hover:bg-primary-50/50">
      <p className="eyebrow">
        {article.article_type || "Research Article"}
        {article.pages ? ` · pp. ${article.pages}` : ""}
      </p>
      <Link
        href={`/article/${article.id}`}
        className="mt-1.5 block font-serif text-xl font-semibold leading-snug text-primary-900 underline-offset-2 group-hover:text-teal-700 group-hover:underline"
      >
        {article.title}
      </Link>
      <p className="mt-1 text-sm text-gray-600">{article.authors_display}</p>
      {article.abstract && (
        <p className="mt-2 line-clamp-2 font-serif text-sm leading-relaxed text-gray-500">
          {article.abstract}
        </p>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {article.doi && (
          <a
            href={`https://doi.org/${article.doi}`}
            className="text-primary-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:{article.doi}
          </a>
        )}
        {(article.pdf_url || article.koreascience_url) && (
          <a
            href={article.pdf_url || article.koreascience_url}
            className="inline-flex items-center gap-1 text-primary-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" /> PDF on KoreaScience
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
        <span className="flex flex-wrap gap-1.5">
          {parseJson<string[]>(article.keywords, []).slice(0, 5).map((k) => (
            <span key={k} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
              {k}
            </span>
          ))}
        </span>
      </p>
    </li>
  );
}
