"use client";

import { useState } from "react";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function DecisionForm({
  manuscriptId,
  completedReviews,
  status,
}: {
  manuscriptId: number;
  completedReviews: number;
  status: string;
}) {
  const [decision, setDecision] = useState("");
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const decidable = !["accepted", "rejected", "published", "withdrawn"].includes(status);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!decision) {
      setError("Select a decision.");
      return;
    }
    if (
      completedReviews < 2 &&
      !confirm(
        `Only ${completedReviews} review(s) have been completed — JCEA policy expects at least 2 before a decision. Record the decision anyway?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch(api(`/api/manuscripts/${manuscriptId}/decision`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, letter }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.reload();
    } else {
      setError(data.error || "Failed to record decision");
      setBusy(false);
    }
  }

  if (!decidable) {
    return (
      <p className="text-sm text-gray-500">
        This manuscript is {status} — no further decisions can be recorded
        {status === "accepted" ? " (assign it to an issue under Issue Management)" : ""}.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="decision" className={labelCls}>
          Decision
        </label>
        <select
          id="decision"
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          className="w-full rounded-md border border-gray-300 py-2 pl-2 pr-8 text-sm shadow-sm"
        >
          <option value="">— Select —</option>
          <option value="accept">Accept</option>
          <option value="minor_revision">Minor Revision</option>
          <option value="major_revision">Major Revision</option>
          <option value="reject">Reject</option>
        </select>
      </div>
      <div>
        <label htmlFor="letter" className={labelCls}>
          Decision letter to author
        </label>
        <textarea
          id="letter"
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          rows={6}
          className={inputCls}
          placeholder="Dear author, … (this text is shown to the author with the decision)"
        />
      </div>
      <p className="text-xs text-gray-500">
        {completedReviews} completed review{completedReviews === 1 ? "" : "s"} on file.
      </p>
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Recording…" : "Record Decision"}
      </button>
    </form>
  );
}
