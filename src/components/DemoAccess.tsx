"use client";

import { useState } from "react";
import { api } from "@/lib/basePath";
import { PenLine, ClipboardList, FileSearch, Settings2 } from "lucide-react";

const PERSONAS = [
  {
    role: "author",
    label: "Author",
    icon: PenLine,
    blurb: "Submit a manuscript and track its status",
  },
  {
    role: "editor",
    label: "Editor-in-Chief",
    icon: ClipboardList,
    blurb: "Manage the queue and find reviewers with AI",
  },
  {
    role: "reviewer",
    label: "Reviewer",
    icon: FileSearch,
    blurb: "Accept an invitation and write a review",
  },
  {
    role: "admin",
    label: "Admin",
    icon: Settings2,
    blurb: "CMS, issues, DOIs, and AI content approval",
  },
];

export default function DemoAccess() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function enter(role: string) {
    setBusy(role);
    setError("");
    const res = await fetch(api("/api/auth/demo"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = api(data.redirect || "/author");
    } else {
      setError(data.error || "Demo sign-in failed");
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="demo-access-heading"
      className="rounded-lg border border-teal-200 bg-teal-50/60 p-5"
    >
      <h2 id="demo-access-heading" className="text-sm font-bold text-teal-800">
        Just exploring? Try the demo — no account needed
      </h2>
      <p className="mt-1 text-xs text-gray-600">
        One click signs you into a pre-loaded demo role on this test system.
        (The production system will require a real account.)
      </p>
      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {PERSONAS.map((p) => (
          <button
            key={p.role}
            type="button"
            disabled={busy !== null}
            onClick={() => enter(p.role)}
            className="flex items-start gap-2.5 rounded-md border border-teal-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-teal-500 hover:bg-teal-50 disabled:opacity-60"
          >
            <p.icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
            <span>
              <span className="block text-sm font-semibold text-gray-900">
                {busy === p.role ? "Entering…" : `Explore as ${p.label}`}
              </span>
              <span className="block text-xs text-gray-500">{p.blurb}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
