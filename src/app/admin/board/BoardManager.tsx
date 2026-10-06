"use client";

import { useState } from "react";
import { Card, CardHeader, btnPrimary, btnSecondary, inputCls, labelCls, Badge } from "@/components/ui";
import { Pencil, Trash2 } from "lucide-react";

import { api } from "@/lib/basePath";
interface Member {
  id: number;
  name: string;
  role: string;
  affiliation: string;
  country: string;
  email: string;
  research_areas: string; // comma-joined for editing
  bio: string;
  sort_order: number;
  active: number;
}

const ROLES = [
  "Editor-in-Chief",
  "Founding Editor-in-Chief",
  "Managing Editor",
  "Book Review Editor",
  "Associate Editor",
  "Editorial Board",
  "Advisory Board",
];

const emptyMember: Member = {
  id: 0,
  name: "",
  role: "Editorial Board",
  affiliation: "",
  country: "",
  email: "",
  research_areas: "",
  bio: "",
  sort_order: 100,
  active: 1,
};

export default function BoardManager({ members }: { members: Member[] }) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError("");
    const res = await fetch(
      api(editing.id ? `/api/admin/board/${editing.id}` : "/api/admin/board"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.location.reload();
    else {
      setError(data.error || "Save failed");
      setBusy(false);
    }
  }

  async function remove(id: number, name: string) {
    if (!confirm(`Remove ${name} from the editorial board?`)) return;
    const res = await fetch(api(`/api/admin/board/${id}`), { method: "DELETE" });
    if (res.ok) window.location.reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader
          title={`Members (${members.length})`}
          actions={
            <button type="button" className={btnPrimary} onClick={() => setEditing({ ...emptyMember })}>
              Add Member
            </button>
          }
        />
        <ul className="divide-y divide-gray-100 px-5">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0 text-sm">
                <span className="font-medium text-gray-900">{m.name}</span>
                <span className="text-gray-500"> — {m.affiliation}{m.country ? `, ${m.country}` : ""}</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-primary-100 text-primary-700">{m.role}</Badge>
                  {m.active === 0 && <Badge className="bg-gray-100 text-gray-500">Inactive</Badge>}
                </div>
              </div>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ ...m })}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-700"
                  aria-label={`Edit ${m.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id, m.name)}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {editing && (
        <Card className="h-fit">
          <CardHeader title={editing.id ? `Edit: ${editing.name}` : "Add board member"} />
          <div className="space-y-3 px-5 py-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <div>
              <label className={labelCls}>Name *</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                className="w-full rounded-md border border-gray-300 py-2 pl-2 pr-8 text-sm shadow-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Affiliation</label>
              <input
                value={editing.affiliation}
                onChange={(e) => setEditing({ ...editing, affiliation: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Country</label>
                <input
                  value={editing.country}
                  onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sort order</label>
                <input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Research areas <span className="font-normal text-gray-500">(comma-separated)</span>
              </label>
              <input
                value={editing.research_areas}
                onChange={(e) => setEditing({ ...editing, research_areas: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea
                value={editing.bio}
                onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                rows={3}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editing.active === 1}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 rounded border-gray-300"
              />
              Active (shown on public page)
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={busy || !editing.name} className={btnPrimary}>
                {busy ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
