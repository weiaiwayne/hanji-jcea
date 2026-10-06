"use client";

import { useState } from "react";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function IssueCreateForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(api("/api/issues"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        volume: Number(fd.get("volume")),
        number: Number(fd.get("number")),
        year: Number(fd.get("year")),
        title: fd.get("title"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.reload();
    } else {
      setError(data.error || "Failed to create issue");
      setBusy(false);
    }
  }

  const year = new Date().getFullYear();
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="volume" className={labelCls}>Volume *</label>
          <input id="volume" name="volume" type="number" min={1} required className={inputCls} />
        </div>
        <div>
          <label htmlFor="number" className={labelCls}>Number *</label>
          <input id="number" name="number" type="number" min={1} required className={inputCls} />
        </div>
        <div>
          <label htmlFor="year" className={labelCls}>Year *</label>
          <input id="year" name="year" type="number" defaultValue={year} required className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="issue-title" className={labelCls}>
          Issue title <span className="font-normal text-gray-500">(optional, e.g. special issue theme)</span>
        </label>
        <input id="issue-title" name="title" className={inputCls} />
      </div>
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Creating…" : "Create Issue"}
      </button>
    </form>
  );
}
