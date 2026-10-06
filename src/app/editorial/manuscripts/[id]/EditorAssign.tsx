"use client";

import { useState } from "react";
import { btnSecondary } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function EditorAssign({
  manuscriptId,
  editors,
  current,
}: {
  manuscriptId: number;
  editors: { id: number; name: string }[];
  current: number | null;
}) {
  const [value, setValue] = useState(current ? String(current) : "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    const res = await fetch(api(`/api/manuscripts/${manuscriptId}/assign-editor`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editorId: value ? Number(value) : null }),
    });
    setBusy(false);
    setMessage(res.ok ? "Saved." : "Failed to save.");
    if (res.ok) setTimeout(() => window.location.reload(), 400);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="editor-select">Handling editor</label>
      <select
        id="editor-select"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 rounded-md border border-gray-300 py-2 pl-2 pr-8 text-sm shadow-sm"
      >
        <option value="">— Unassigned —</option>
        {editors.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={save} disabled={busy} className={btnSecondary}>
        {busy ? "Saving…" : "Assign"}
      </button>
      <span className="text-xs text-teal-700" aria-live="polite">{message}</span>
    </div>
  );
}
