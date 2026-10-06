import { getDb, parseJson } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import BoardManager from "./BoardManager";

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  await requireUser("admin");
  const rows = getDb()
    .prepare("SELECT * FROM board_members ORDER BY sort_order, name")
    .all() as {
    id: number;
    name: string;
    role: string;
    affiliation: string;
    country: string;
    email: string;
    research_areas: string;
    bio: string;
    sort_order: number;
    active: number;
  }[];

  return (
    <>
      <PageTitle
        title="Editorial Board Management"
        subtitle="Members appear on the public Editorial Board page in the order below."
      />
      <BoardManager
        members={rows.map((r) => ({
          ...r,
          research_areas: parseJson<string[]>(r.research_areas, []).join(", "),
        }))}
      />
    </>
  );
}
