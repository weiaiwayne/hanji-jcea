import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MS_STATUS_COLORS, MS_STATUS_LABELS, fmtDate, daysSince } from "@/lib/format";
import { Badge, Card, PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All active" },
  { key: "submitted", label: "New submissions" },
  { key: "under_review", label: "Under review" },
  { key: "revised", label: "Revised" },
  { key: "revision_requested", label: "Awaiting revision" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "published", label: "Published" },
];

const SORTS: Record<string, string> = {
  newest: "m.submitted_at DESC",
  oldest: "m.submitted_at ASC",
  updated: "m.updated_at DESC",
  title: "m.title ASC",
};

export default async function EditorialQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; q?: string; mine?: string }>;
}) {
  const user = await requireUser("editor", "eic");
  const { status = "all", sort = "newest", q = "", mine } = await searchParams;
  const db = getDb();

  const where: string[] = ["m.status != 'draft'"];
  const args: unknown[] = [];
  if (status === "all") {
    where.push("m.status NOT IN ('rejected','withdrawn','published')");
  } else if (FILTERS.some((f) => f.key === status)) {
    where.push("m.status = ?");
    args.push(status);
  }
  if (q) {
    where.push("(m.title LIKE ? OR m.number LIKE ? OR m.abstract LIKE ?)");
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (mine === "1") {
    where.push("m.handling_editor_id = ?");
    args.push(user.id);
  }

  const rows = db
    .prepare(
      `SELECT m.id, m.number, m.title, m.status, m.submitted_at, m.updated_at, m.round,
              u.name AS author_name,
              e.name AS editor_name,
              (SELECT COUNT(*) FROM reviewer_assignments ra WHERE ra.manuscript_id = m.id AND ra.status IN ('invited','accepted')) AS active_reviewers,
              (SELECT COUNT(*) FROM reviewer_assignments ra WHERE ra.manuscript_id = m.id AND ra.status = 'completed') AS completed_reviews
       FROM manuscripts m
       JOIN users u ON u.id = m.corresponding_author_id
       LEFT JOIN users e ON e.id = m.handling_editor_id
       WHERE ${where.join(" AND ")}
       ORDER BY ${SORTS[sort] || SORTS.newest}`
    )
    .all(...args) as {
    id: number;
    number: string;
    title: string;
    status: string;
    submitted_at: string;
    updated_at: string;
    round: number;
    author_name: string;
    editor_name: string | null;
    active_reviewers: number;
    completed_reviews: number;
  }[];

  const counts = db
    .prepare("SELECT status, COUNT(*) AS n FROM manuscripts WHERE status != 'draft' GROUP BY status")
    .all() as { status: string; n: number }[];
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c.n]));

  return (
    <>
      <PageTitle
        title="Manuscript Queue"
        subtitle={`${rows.length} manuscripts shown · ${countMap["submitted"] || 0} new · ${countMap["under_review"] || 0} under review`}
      />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="q">Search manuscripts</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search title, number, abstract…"
          className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm"
        />
        <label className="sr-only" htmlFor="sort">Sort</label>
        <select
          id="sort"
          name="sort"
          defaultValue={sort}
          className="rounded-md border border-gray-300 py-1.5 pl-2 pr-8 text-sm shadow-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="updated">Recently updated</option>
          <option value="title">Title A–Z</option>
        </select>
        <input type="hidden" name="status" value={status} />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" name="mine" value="1" defaultChecked={mine === "1"} className="h-4 w-4 rounded border-gray-300" />
          Assigned to me
        </label>
        <button type="submit" className="rounded-md bg-primary-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">
          Apply
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Status filter">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/editorial?status=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === f.key
                ? "bg-primary-700 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
            {f.key !== "all" && countMap[f.key] ? ` (${countMap[f.key]})` : ""}
          </Link>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Manuscript</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Editor</th>
                <th className="px-5 py-3">Reviews</th>
                <th className="px-5 py-3">Days in Review</th>
                <th className="px-5 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((m) => {
                const days = daysSince(m.submitted_at);
                return (
                  <tr key={m.id} className="align-top hover:bg-gray-50">
                    <td className="max-w-md px-5 py-3">
                      <Link
                        href={`/editorial/manuscripts/${m.id}`}
                        className="font-medium text-primary-800 hover:underline"
                      >
                        {m.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {m.number} · {m.author_name}
                        {m.round > 1 ? ` · round ${m.round}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={MS_STATUS_COLORS[m.status] || ""}>
                        {MS_STATUS_LABELS[m.status] || m.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{m.editor_name || <span className="text-accent-700">Unassigned</span>}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {m.completed_reviews} done
                      {m.active_reviewers > 0 ? ` · ${m.active_reviewers} active` : ""}
                    </td>
                    <td className="px-5 py-3">
                      {["under_review", "revised", "submitted"].includes(m.status) && days !== null ? (
                        <span className={days > 60 ? "font-semibold text-red-600" : "text-gray-600"}>
                          {days}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{fmtDate(m.submitted_at)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No manuscripts match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
