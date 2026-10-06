"use client";

import { useState } from "react";
import { btnPrimary } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function PublishIssueButton({
  issueId,
  articleCount,
  doisReady,
}: {
  issueId: number;
  articleCount: number;
  doisReady: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    if (articleCount === 0) {
      setError("No articles in this issue");
      return;
    }
    const warning = doisReady
      ? `Publish this issue with ${articleCount} article(s)? It will appear on the public site.`
      : `Not all DOIs are registered yet. Publish anyway? The issue will appear on the public site.`;
    if (!confirm(warning)) return;
    setBusy(true);
    setError("");
    const res = await fetch(api(`/api/admin/issues/${issueId}/publish`), { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.location.reload();
    else {
      setError(data.error || "Publish failed");
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button type="button" onClick={publish} disabled={busy} className={btnPrimary}>
        {busy ? "Publishing…" : "Publish Issue"}
      </button>
    </span>
  );
}
