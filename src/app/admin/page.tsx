import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { intuitionistHealth } from "@/lib/intuitionist";
import { Card, CardHeader, PageTitle, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  await requireUser("admin");
  const db = getDb();

  const stat = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const stats = [
    { label: "Users", value: stat("SELECT COUNT(*) AS n FROM users"), href: "/admin/users" },
    {
      label: "Active manuscripts",
      value: stat(
        "SELECT COUNT(*) AS n FROM manuscripts WHERE status IN ('submitted','under_review','revision_requested','revised')"
      ),
      href: "/editorial",
    },
    {
      label: "Published articles",
      value: stat("SELECT COUNT(*) AS n FROM articles WHERE published_at IS NOT NULL"),
      href: "/admin/issues",
    },
    {
      label: "AI assets pending approval",
      value: stat("SELECT COUNT(*) AS n FROM ai_assets WHERE status = 'generated'"),
      href: "/admin/ai",
    },
    { label: "CMS pages", value: stat("SELECT COUNT(*) AS n FROM cms_pages"), href: "/admin/pages" },
    {
      label: "Board members",
      value: stat("SELECT COUNT(*) AS n FROM board_members WHERE active = 1"),
      href: "/admin/board",
    },
  ];

  const intuitionist = await intuitionistHealth();

  return (
    <>
      <PageTitle title="Admin Overview" subtitle="System status and shortcuts." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="px-5 py-4 transition-colors hover:border-primary-300">
              <p className="text-3xl font-bold text-primary-800">{s.value}</p>
              <p className="mt-1 text-sm text-gray-600">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Service health" subtitle="Also available as JSON at /api/health" />
        <ul className="divide-y divide-gray-100 px-5">
          <li className="flex items-center justify-between py-3 text-sm">
            <span className="font-medium text-gray-800">Database (SQLite)</span>
            <Badge className="bg-teal-100 text-teal-700">OK</Badge>
          </li>
          <li className="flex items-center justify-between py-3 text-sm">
            <span className="font-medium text-gray-800">
              Intuitionist reviewer finder{" "}
              <span className="font-normal text-gray-500">(localhost:3848)</span>
            </span>
            <Badge className={intuitionist.ok ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"}>
              {intuitionist.ok ? "OK" : "Unreachable"}
            </Badge>
          </li>
        </ul>
      </Card>
    </>
  );
}
