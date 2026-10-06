"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui";

import { api } from "@/lib/basePath";
const FEATURES = [
  { key: "podcast", label: "AI-generated podcast of my paper" },
  { key: "summary", label: "AI-generated plain-language summary" },
  { key: "viz", label: "AI-generated visualizations" },
] as const;

export default function ConsentToggles({
  manuscriptId,
  initial,
}: {
  manuscriptId: number;
  initial: { podcast: boolean; summary: boolean; viz: boolean };
}) {
  const [consent, setConsent] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle(key: "podcast" | "summary" | "viz", value: boolean) {
    const next = { ...consent, [key]: value };
    setConsent(next);
    setSaving(true);
    setMessage("");
    const res = await fetch(api(`/api/submissions/${manuscriptId}/consent`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Preferences saved.");
      setTimeout(() => setMessage(""), 2500);
    } else {
      setConsent(consent); // revert
      setMessage("Could not save — please try again.");
    }
  }

  return (
    <Card>
      <CardHeader
        title="AI feature consent"
        subtitle="Opt-in only. Generated content requires editorial approval and can be withdrawn any time."
      />
      <div className="space-y-3 px-5 py-4">
        {FEATURES.map((f) => (
          <label key={f.key} className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={consent[f.key]}
              disabled={saving}
              onChange={(e) => toggle(f.key, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600"
            />
            {f.label}
          </label>
        ))}
        <p className="min-h-4 text-xs text-teal-700" aria-live="polite">
          {message}
        </p>
      </div>
    </Card>
  );
}
