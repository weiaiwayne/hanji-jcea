"use client";

import { useState } from "react";

import { api } from "@/lib/basePath";
export function GenerateButton({
  manuscriptId,
  type,
  label,
}: {
  manuscriptId: number;
  type: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    setBusy(true);
    setError("");
    const res = await fetch(api("/api/ai/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manuscriptId, type }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.location.reload();
    else {
      setError(data.error || "Failed to start generation");
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="rounded-md bg-primary-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
      >
        {busy ? "Starting…" : label}
      </button>
    </span>
  );
}

export default function AiAssetControls({
  assetId,
  status,
}: {
  assetId: number;
  status: string;
}) {
  const [busy, setBusy] = useState(false);

  async function act(action: string) {
    setBusy(true);
    const res = await fetch(api(`/api/ai-assets/${assetId}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) window.location.reload();
    else setBusy(false);
  }

  if (status === "approved") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => act("unpublish")}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Unpublish
      </button>
    );
  }
  return (
    <span className="flex gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => act("approve")}
        className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50"
      >
        Approve & publish
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => act("reject")}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
    </span>
  );
}
