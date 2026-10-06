import Link from "next/link";
import { getDb, getSettings, parseJson } from "@/lib/db";
import type { Metadata } from "next";
import BoardList from "./BoardList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editorial Board" };

export interface BoardMember {
  id: number;
  name: string;
  role: string;
  affiliation: string;
  country: string;
  researchAreas: string[];
  photoUrl: string;
  bio: string;
}

export default function EditorialBoardPage() {
  const settings = getSettings();
  const rows = getDb()
    .prepare(
      "SELECT * FROM board_members WHERE active = 1 ORDER BY sort_order, name"
    )
    .all() as {
    id: number;
    name: string;
    role: string;
    affiliation: string;
    country: string;
    research_areas: string;
    photo_url: string;
    bio: string;
  }[];

  const members: BoardMember[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    affiliation: r.affiliation,
    country: r.country,
    researchAreas: parseJson<string[]>(r.research_areas, []),
    photoUrl: r.photo_url,
    bio: r.bio,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-primary-900">Editorial Board</h1>
      <p className="mt-2 max-w-3xl text-gray-600">
        The editorial board of the Journal of Contemporary Eastern Asia brings
        together recognised scholars in the journal&rsquo;s subject areas, from
        institutions across Asia, Europe, North America, and beyond. Every member
        is listed with their current affiliation and serves with their agreement.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-gray-500">
        The board is reviewed at least annually to keep affiliations current and
        to confirm continued membership. Last reviewed:{" "}
        {settings.board_reviewed || "September 2026"}. Editors take decisions
        independently of the publishers &mdash; see{" "}
        <Link href="/editorial-process" className="text-teal-600 hover:underline">
          Editorial Process
        </Link>{" "}
        and{" "}
        <Link href="/publication-ethics#coi" className="text-teal-600 hover:underline">
          Conflicts of interest
        </Link>
        .
      </p>
      <BoardList members={members} />
    </div>
  );
}
