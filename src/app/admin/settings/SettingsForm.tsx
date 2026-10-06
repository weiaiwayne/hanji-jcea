"use client";

import { useState } from "react";
import { Card, CardHeader, btnPrimary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
const FIELDS: { key: string; label: string; textarea?: boolean }[] = [
  { key: "journal_name", label: "Journal name" },
  { key: "journal_abbrev", label: "Abbreviation" },
  { key: "issn", label: "ISSN" },
  { key: "frequency", label: "Publication frequency" },
  { key: "publisher", label: "Publisher", textarea: true },
  { key: "apc", label: "Article processing charges (APC)", textarea: true },
  { key: "contact_email", label: "Contact email" },
  { key: "support_email", label: "Technical support email" },
  { key: "postal_address", label: "Postal address", textarea: true },
  { key: "license", label: "Content license" },
  { key: "twitter_url", label: "X / Twitter URL" },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "ai_features_enabled", label: "AI features enabled globally (yes/no)" },
  { key: "demo_mode", label: "Demo mode — one-click demo sign-in on login page (yes/no)" },
  { key: "ollama_model", label: "Ollama model for AI summaries/scripts" },
];

export default function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    const res = await fetch(api("/api/admin/settings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setBusy(false);
    setMessage(res.ok ? "Settings saved." : "Save failed.");
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Journal metadata" />
      <div className="space-y-4 px-5 py-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`s-${f.key}`} className={labelCls}>
              {f.label}
            </label>
            {f.textarea ? (
              <textarea
                id={`s-${f.key}`}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                rows={2}
                className={inputCls}
              />
            ) : (
              <input
                id={`s-${f.key}`}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className={inputCls}
              />
            )}
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save Settings"}
          </button>
          <span className="text-sm text-teal-700" aria-live="polite">{message}</span>
        </div>
      </div>
    </Card>
  );
}
