"use client";

import { useState } from "react";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function RevisionUpload({ manuscriptId }: { manuscriptId: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(api(`/api/submissions/${manuscriptId}/revision`), {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="revision-file" className={labelCls}>
          Revised manuscript (PDF) *
        </label>
        <input
          id="revision-file"
          name="revision"
          type="file"
          accept=".pdf,application/pdf"
          required
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </div>
      <div>
        <label htmlFor="response-letter" className={labelCls}>
          Response to reviewers
        </label>
        <textarea
          id="response-letter"
          name="response"
          rows={4}
          className={inputCls}
          placeholder="Summarize how you addressed each reviewer comment…"
        />
      </div>
      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? "Uploading…" : "Submit Revision"}
      </button>
    </form>
  );
}
