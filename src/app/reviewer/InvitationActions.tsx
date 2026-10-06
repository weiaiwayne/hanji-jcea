"use client";

import { useState } from "react";

import { api } from "@/lib/basePath";
export default function InvitationActions({ assignmentId }: { assignmentId: number }) {
  const [busy, setBusy] = useState(false);

  async function respond(status: "accepted" | "declined") {
    setBusy(true);
    const res = await fetch(api(`/api/assignments/${assignmentId}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) window.location.reload();
    else setBusy(false);
  }

  return (
    <span className="flex gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => respond("accepted")}
        className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50"
      >
        Accept invitation
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => respond("declined")}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Decline
      </button>
    </span>
  );
}
