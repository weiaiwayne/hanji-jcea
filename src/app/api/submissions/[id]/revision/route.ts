import { NextRequest, NextResponse } from "next/server";
import { getDb, addEvent } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { saveUpload } from "@/lib/files";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;

  const db = getDb();
  const ms = db
    .prepare("SELECT * FROM manuscripts WHERE id = ?")
    .get(Number(id)) as
    | { id: number; corresponding_author_id: number; status: string; round: number; number: string }
    | undefined;
  if (!ms || ms.corresponding_author_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ms.status !== "revision_requested") {
    return NextResponse.json(
      { error: "A revision is not currently requested for this manuscript" },
      { status: 400 }
    );
  }

  const fd = await req.formData().catch(() => null);
  const file = fd?.get("revision");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Revised manuscript PDF is required" }, { status: 400 });
  }
  const newRound = ms.round + 1;
  await saveUpload({
    manuscriptId: ms.id,
    file,
    kind: "revision",
    round: newRound,
    uploadedBy: user.id,
  });

  const response = String(fd?.get("response") || "");
  db.prepare(
    "UPDATE manuscripts SET status = 'revised', round = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(newRound, ms.id);

  addEvent({
    manuscriptId: ms.id,
    actorUserId: user.id,
    type: "revision_uploaded",
    description: `Revised manuscript uploaded (round ${newRound})`,
    meta: { response },
  });
  return NextResponse.json({ ok: true });
}
