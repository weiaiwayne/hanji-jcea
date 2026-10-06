"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";

import { api } from "@/lib/basePath";
const DOI_STATUS_CLS: Record<string, string> = {
  none: "bg-gray-100 text-gray-600",
  prepared: "bg-accent-100 text-accent-700",
  registered: "bg-teal-100 text-teal-700",
};

export default function ArticleDoiEditor({
  article,
}: {
  article: {
    id: number;
    doi: string;
    doi_status: string;
    koreascience_url: string;
    pdf_url: string;
    pages: string;
  };
}) {
  const [doi, setDoi] = useState(article.doi);
  const [status, setStatus] = useState(article.doi_status);
  const [ksUrl, setKsUrl] = useState(article.koreascience_url);
  const [pdfUrl, setPdfUrl] = useState(article.pdf_url);
  const [pages, setPages] = useState(article.pages);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    const res = await fetch(api(`/api/admin/articles/${article.id}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doi,
        doi_status: status,
        koreascience_url: ksUrl,
        pdf_url: pdfUrl,
        pages,
      }),
    });
    setBusy(false);
    setMessage(res.ok ? "Saved." : "Save failed.");
    setTimeout(() => setMessage(""), 2500);
  }

  const inputCls =
    "rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm placeholder:text-gray-400";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Badge className={DOI_STATUS_CLS[status] || ""}>DOI {status}</Badge>
      <label className="sr-only" htmlFor={`doi-${article.id}`}>DOI</label>
      <input
        id={`doi-${article.id}`}
        value={doi}
        onChange={(e) => setDoi(e.target.value)}
        placeholder="10.17477/jcea…"
        className={`${inputCls} w-44`}
      />
      <label className="sr-only" htmlFor={`doistatus-${article.id}`}>DOI status</label>
      <select
        id={`doistatus-${article.id}`}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-md border border-gray-300 py-1 pl-2 pr-7 text-xs shadow-sm"
      >
        <option value="none">Not started</option>
        <option value="prepared">Metadata prepared</option>
        <option value="registered">Registered</option>
      </select>
      <label className="sr-only" htmlFor={`ks-${article.id}`}>KoreaScience URL</label>
      <input
        id={`ks-${article.id}`}
        value={ksUrl}
        onChange={(e) => setKsUrl(e.target.value)}
        placeholder="KoreaScience landing URL"
        className={`${inputCls} w-56`}
      />
      <label className="sr-only" htmlFor={`pdf-${article.id}`}>PDF URL</label>
      <input
        id={`pdf-${article.id}`}
        value={pdfUrl}
        onChange={(e) => setPdfUrl(e.target.value)}
        placeholder="KoreaScience PDF URL"
        className={`${inputCls} w-56`}
      />
      <label className="sr-only" htmlFor={`pages-${article.id}`}>Pages</label>
      <input
        id={`pages-${article.id}`}
        value={pages}
        onChange={(e) => setPages(e.target.value)}
        placeholder="pp. 1-24"
        className={`${inputCls} w-20`}
      />
      <a
        href={api(`/api/admin/articles/${article.id}/doi-export?format=xml`)}
        className="text-xs text-primary-600 hover:underline"
      >
        XML
      </a>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-md bg-primary-700 px-3 py-1 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50"
      >
        {busy ? "…" : "Save"}
      </button>
      <span className="text-xs text-teal-700" aria-live="polite">{message}</span>
    </div>
  );
}
