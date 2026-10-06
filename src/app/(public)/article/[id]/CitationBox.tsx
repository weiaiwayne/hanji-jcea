"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

import { api } from "@/lib/basePath";
export default function CitationBox({
  articleId,
  apa,
}: {
  articleId: number;
  apa: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(apa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can select the text manually
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
        Cite This Article
      </h2>
      <p className="mt-2 rounded-md bg-gray-50 p-3 font-serif text-sm leading-relaxed text-gray-700">
        {apa}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy APA
            </>
          )}
        </button>
        <a
          href={api(`/api/articles/${articleId}/citation?format=bibtex`)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> BibTeX
        </a>
        <a
          href={api(`/api/articles/${articleId}/citation?format=ris`)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> RIS / EndNote
        </a>
      </div>
    </div>
  );
}
