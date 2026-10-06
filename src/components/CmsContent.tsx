import { getDb } from "@/lib/db";
import { BASE_PATH } from "@/lib/basePath";
import { notFound } from "next/navigation";

export interface CmsPageRow {
  id: number;
  slug: string;
  title: string;
  html: string;
  updated_at: string;
}

export function getCmsPage(slug: string): CmsPageRow | undefined {
  return getDb()
    .prepare("SELECT * FROM cms_pages WHERE slug = ?")
    .get(slug) as CmsPageRow | undefined;
}

/**
 * Prefixes root-relative links in CMS HTML with the deployment basePath. Editors
 * write plain hrefs like "/copyright"; Next.js rewrites <Link> but not raw HTML,
 * so without this every cross-page link in the CMS body 404s under /jcea.
 * Protocol-relative ("//host") and external URLs are left alone.
 */
export function withBasePath(html: string): string {
  if (!BASE_PATH) return html;
  return html.replace(
    /(\s(?:href|src)=)(["'])\/(?!\/)/g,
    (_m, attr, quote) => `${attr}${quote}${BASE_PATH}/`
  );
}

/**
 * Renders a CMS-managed page body. Content is authored by admins through the
 * CMS editor and stored as HTML.
 */
export default function CmsContent({ slug, fallbackTitle }: { slug: string; fallbackTitle?: string }) {
  const page = getCmsPage(slug);
  if (!page) {
    if (!fallbackTitle) notFound();
    return (
      <article className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-serif text-3xl font-bold text-primary-900">{fallbackTitle}</h1>
        <p className="mt-4 text-gray-500">This page has not been published yet.</p>
      </article>
    );
  }
  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-primary-900">{page.title}</h1>
      <div
        className="prose-jcea mt-6"
        dangerouslySetInnerHTML={{ __html: withBasePath(page.html) }}
      />
    </article>
  );
}
