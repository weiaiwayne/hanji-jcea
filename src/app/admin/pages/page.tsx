import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { Card, PageTitle, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminPagesList() {
  await requireUser("admin");
  const pages = getDb()
    .prepare("SELECT id, slug, title, updated_at, length(html) AS size FROM cms_pages ORDER BY nav_order, slug")
    .all() as { id: number; slug: string; title: string; updated_at: string; size: number }[];

  return (
    <>
      <PageTitle
        title="Website Pages"
        subtitle="Edit the content of the public site with the rich text editor."
        actions={
          <Link href="/admin/pages/new" className={btnPrimary}>
            New Page
          </Link>
        }
      />
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Last updated</th>
              <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/pages/${p.id}`} className="font-medium text-primary-800 hover:underline">
                    {p.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray-600">/{p.slug}</td>
                <td className="px-5 py-3 text-gray-600">{fmtDateTime(p.updated_at)}</td>
                <td className="px-5 py-3 text-right">
                  <a href={`/${p.slug}`} target="_blank" className="text-xs text-primary-600 hover:underline">
                    View live ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
