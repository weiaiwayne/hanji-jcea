"use client";

import { useState } from "react";
import { btnSecondary } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function AssignToIssue({
  manuscriptId,
  issues,
}: {
  manuscriptId: number;
  issues: { id: number; label: string }[];
}) {
  const [issueId, setIssueId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function assign() {
    if (!issueId) return;
    setBusy(true);
    setError("");
    const res = await fetch(api(`/api/issues/${issueId}/assign`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manuscriptId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.reload();
    } else {
      setError(data.error || "Failed");
      setBusy(false);
    }
  }

  if (issues.length === 0) {
    return <span className="text-xs text-gray-500">Create an issue first</span>;
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <label className="sr-only" htmlFor={`issue-for-${manuscriptId}`}>Target issue</label>
      <select
        id={`issue-for-${manuscriptId}`}
        value={issueId}
        onChange={(e) => setIssueId(e.target.value)}
        className="rounded-md border border-gray-300 py-1.5 pl-2 pr-7 text-sm shadow-sm"
      >
        <option value="">Select issue…</option>
        {issues.map((i) => (
          <option key={i.id} value={i.id}>
            {i.label}
          </option>
        ))}
      </select>
      <button type="button" onClick={assign} disabled={busy || !issueId} className={btnSecondary}>
        {busy ? "Assigning…" : "Assign"}
      </button>
    </span>
  );
}
