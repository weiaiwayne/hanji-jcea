"use client";

import { useState } from "react";

import { api } from "@/lib/basePath";
const TRANSITIONS: Record<string, { label: string; to: string }[]> = {
  invited: [
    { label: "Mark accepted", to: "accepted" },
    { label: "Mark declined", to: "declined" },
    { label: "Cancel", to: "cancelled" },
  ],
  accepted: [{ label: "Cancel", to: "cancelled" }],
  declined: [{ label: "Re-invite", to: "invited" }],
};

export default function AssignmentActions({
  assignmentId,
  status,
}: {
  assignmentId: number;
  status: string;
}) {
  const [busy, setBusy] = useState(false);
  const options = TRANSITIONS[status] || [];
  if (options.length === 0) return null;

  async function update(to: string) {
    setBusy(true);
    const res = await fetch(api(`/api/assignments/${assignmentId}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    if (res.ok) window.location.reload();
    else setBusy(false);
  }

  return (
    <span className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.to}
          type="button"
          disabled={busy}
          onClick={() => update(o.to)}
          className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}
