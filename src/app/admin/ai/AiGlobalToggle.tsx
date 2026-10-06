"use client";

import { useState } from "react";

import { api } from "@/lib/basePath";
export default function AiGlobalToggle({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(api("/api/admin/settings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ai_features_enabled: enabled ? "no" : "yes" }),
    });
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={enabled}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        enabled
          ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      }`}
    >
      AI features: {enabled ? "Enabled" : "Disabled"} — click to {enabled ? "disable" : "enable"}
    </button>
  );
}
