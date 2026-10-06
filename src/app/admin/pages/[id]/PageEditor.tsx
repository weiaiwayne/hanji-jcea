"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
export default function PageEditor({
  page,
  isNew,
}: {
  page: { id: number; slug: string; title: string; html: string };
  isNew: boolean;
}) {
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [html, setHtml] = useState(page.html);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch(api(isNew ? "/api/admin/pages" : `/api/admin/pages/${page.id}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, html }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      if (isNew) window.location.href = api(`/admin/pages/${data.id}`);
      else {
        setMessage("Saved.");
        setTimeout(() => setMessage(""), 2500);
      }
    } else {
      setError(data.error || "Save failed");
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="page-title" className={labelCls}>Page title *</label>
          <input
            id="page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="page-slug" className={labelCls}>
            Slug * <span className="font-normal text-gray-500">(URL path, e.g. about-journal)</span>
          </label>
          <input
            id="page-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
            className={inputCls}
          />
        </div>
      </div>
      <RichTextEditor initialHtml={page.html} onChange={setHtml} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy || !title || !slug} className={btnPrimary}>
          {busy ? "Saving…" : "Save Page"}
        </button>
        <a href={`/${slug}`} target="_blank" className="text-sm text-primary-600 hover:underline">
          View live ↗
        </a>
        <span className="text-sm text-teal-700" aria-live="polite">{message}</span>
      </div>
    </div>
  );
}
