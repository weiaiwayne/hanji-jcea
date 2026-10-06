"use client";

import { useState } from "react";
import { Card, CardHeader, Badge, btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";
import { SENIORITY_COLORS, SENIORITY_LABELS } from "@/lib/format";
import type { ProcessedCandidate, PaperAnalysis } from "@/lib/intuitionist";
import { Sparkles, CheckCircle2, AlertTriangle, Plus, Loader2 } from "lucide-react";

import { api } from "@/lib/basePath";
export default function ReviewerFinder({
  manuscriptId,
  defaultText,
  authorNames,
}: {
  manuscriptId: number;
  defaultText: string;
  authorNames: string[];
}) {
  const [text, setText] = useState(defaultText);
  const [num, setNum] = useState(5);
  const [fastMode, setFastMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<ProcessedCandidate[] | null>(null);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [privacy, setPrivacy] = useState("");

  // filters
  const [seniority, setSeniority] = useState("all");
  const [hideConflicts, setHideConflicts] = useState(false);
  const [institution, setInstitution] = useState("");

  // assignment
  const [dueDays, setDueDays] = useState(21);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);

  async function search() {
    setBusy(true);
    setError("");
    setCandidates(null);
    try {
      const res = await fetch(api(`/api/manuscripts/${manuscriptId}/find-reviewers`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscriptText: text, numReviewers: num, fastMode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Reviewer search failed");
      } else {
        setCandidates(data.reviewers);
        setAnalysis(data.paper_analysis || null);
        setPrivacy(data.privacy_notice || "");
      }
    } catch (e) {
      setError(String(e));
    }
    setBusy(false);
  }

  async function assign(c: ProcessedCandidate) {
    setAssigning(c.name);
    setError("");
    const res = await fetch(api(`/api/manuscripts/${manuscriptId}/reviewers`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: c.name,
        affiliation: c.affiliation,
        email: "",
        source: "intuitionist",
        dueDays,
        intuitionistData: c,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAssigned([...assigned, c.name]);
    } else {
      setError(data.error || "Assignment failed");
    }
    setAssigning(null);
  }

  async function manualAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setManualBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(api(`/api/manuscripts/${manuscriptId}/reviewers`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        affiliation: fd.get("affiliation"),
        source: "manual",
        dueDays,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setManualBusy(false);
    if (res.ok) {
      window.location.reload();
    } else {
      setError(data.error || "Assignment failed");
    }
  }

  const filtered = (candidates || []).filter((c) => {
    if (seniority !== "all" && c.seniority !== seniority) return false;
    if (hideConflicts && c.jcea.has_blocking_conflict) return false;
    if (institution && !c.affiliation.toLowerCase().includes(institution.toLowerCase()))
      return false;
    return true;
  });

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
            Intuitionist AI Reviewer Finder
          </span>
        }
        subtitle="Suggests reviewers from a 44k-paper corpus using local embeddings. Results are post-processed against JCEA editorial rules."
        actions={
          <button type="button" className={btnSecondary} onClick={() => setShowManual(!showManual)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add manually
          </button>
        }
      />
      <div className="px-5 py-4">
        {showManual && (
          <form onSubmit={manualAssign} className="mb-5 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">Manually add a reviewer</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Name *</label>
                <input name="name" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input name="email" type="email" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Affiliation</label>
                <input name="affiliation" className={inputCls} />
              </div>
            </div>
            <button type="submit" disabled={manualBusy} className={`${btnPrimary} mt-3`}>
              {manualBusy ? "Inviting…" : "Invite Reviewer"}
            </button>
          </form>
        )}

        <div>
          <label htmlFor="finder-text" className={labelCls}>
            Manuscript text for matching (title + abstract prefilled; paste full text for better results)
          </label>
          <textarea
            id="finder-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className={inputCls}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="finder-num" className={labelCls}>Candidates</label>
            <select
              id="finder-num"
              value={num}
              onChange={(e) => setNum(Number(e.target.value))}
              className="rounded-md border border-gray-300 py-2 pl-2 pr-8 text-sm shadow-sm"
            >
              {[3, 5, 8, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="finder-due" className={labelCls}>Review due in (days)</label>
            <input
              id="finder-due"
              type="number"
              min={7}
              max={90}
              value={dueDays}
              onChange={(e) => setDueDays(Number(e.target.value))}
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={fastMode}
              onChange={(e) => setFastMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Fast mode
            <span className="text-xs text-gray-500">(uncheck for full mode with corpus-gap expansion — slower)</span>
          </label>
          <button type="button" onClick={search} disabled={busy || text.trim().length < 30} className={btnPrimary}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching…
              </>
            ) : (
              "Find Reviewers"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {analysis && (
          <div className="mt-4 rounded-md bg-primary-50 p-3 text-sm">
            <p className="font-medium text-primary-800">
              Paper analysis: {analysis.methodology_type || "unspecified methodology"}
            </p>
            <p className="mt-1 flex flex-wrap gap-1.5">
              {(analysis.key_concepts || []).slice(0, 8).map((c) => (
                <span key={c} className="rounded-full bg-white px-2 py-0.5 text-xs text-primary-700 ring-1 ring-primary-200">
                  {c}
                </span>
              ))}
            </p>
          </div>
        )}

        {candidates && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5">
                <span className="text-gray-600">Seniority:</span>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="rounded-md border border-gray-300 py-1 pl-2 pr-7 text-sm"
                >
                  <option value="all">All</option>
                  <option value="emerging">Emerging</option>
                  <option value="mid-career">Mid-Career</option>
                  <option value="senior">Senior</option>
                </select>
              </label>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Filter by institution…"
                className="w-48 rounded-md border border-gray-300 px-2 py-1 text-sm"
                aria-label="Filter by institution"
              />
              <label className="flex items-center gap-1.5 text-gray-700">
                <input
                  type="checkbox"
                  checked={hideConflicts}
                  onChange={(e) => setHideConflicts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Hide conflicted
              </label>
              <span className="text-gray-500" aria-live="polite">
                {filtered.length} of {candidates.length} shown
              </span>
            </div>

            <ul className="mt-4 space-y-4">
              {filtered.map((c) => {
                const flags: string[] = [];
                if (c.jcea.is_manuscript_author) flags.push("Is a manuscript author");
                if (c.jcea.coauthored_recent)
                  flags.push(
                    `Co-authored with ${c.jcea.coauthored_with.join(", ")} in the last 5 years`
                  );
                if (c.jcea.recently_invited) flags.push("Invited for a JCEA review in the last 12 months");
                if (c.jcea.same_institution) flags.push("Same institution as an author");
                if (c.jcea.is_cited_author) flags.push("Cited in the manuscript (advisory)");
                const isAssigned = assigned.includes(c.name);
                return (
                  <li
                    key={`${c.rank}-${c.name}`}
                    className={`rounded-xl border p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] ${
                      c.jcea.has_blocking_conflict
                        ? "border-red-200 bg-red-50/40"
                        : "border-gray-200/80 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-gray-400">#{c.rank}</span>
                          <span className="font-semibold text-gray-900">{c.name}</span>
                          <Badge className={SENIORITY_COLORS[c.seniority] || ""}>
                            {SENIORITY_LABELS[c.seniority] || c.seniority}
                          </Badge>
                          {c.jcea.has_blocking_conflict ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Conflict
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> No known conflicts
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">
                          {c.affiliation || "Affiliation unknown"}
                          {c.orcid && (
                            <a
                              href={`https://orcid.org/${c.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-teal-600 hover:underline"
                            >
                              ORCID
                            </a>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          h-index {c.h_index} · {c.paper_count} matched paper{c.paper_count === 1 ? "" : "s"} ·
                          similarity {(c.embedding_similarity * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="w-40 rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200/70">
                          <p className="flex items-baseline justify-between">
                            <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-gray-400">
                              Match
                            </span>
                            <span className="font-serif text-lg font-bold text-primary-900">
                              {c.composite_score.toFixed(2)}
                            </span>
                          </p>
                          <div
                            className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200"
                            role="img"
                            aria-label={`Composite score ${c.composite_score.toFixed(2)} out of 1`}
                          >
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-primary-600"
                              style={{ width: `${Math.min(100, c.composite_score * 100)}%` }}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => assign(c)}
                          disabled={isAssigned || assigning !== null}
                          className={c.jcea.has_blocking_conflict ? btnSecondary : btnPrimary}
                          title={
                            c.jcea.has_blocking_conflict
                              ? "This candidate has a conflict flag — assign only with justification"
                              : "Assign as reviewer"
                          }
                        >
                          {isAssigned
                            ? "Assigned ✓"
                            : assigning === c.name
                              ? "Assigning…"
                              : c.jcea.has_blocking_conflict
                                ? "Assign anyway"
                                : "Assign"}
                        </button>
                      </div>
                    </div>

                    {flags.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-red-700">
                        {flags.map((f) => (
                          <li key={f} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      PhD status requires editor confirmation (per JCEA policy).
                    </p>

                    {c.relevant_papers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Relevant papers
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-gray-600">
                          {c.relevant_papers.slice(0, 3).map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="py-6 text-center text-sm text-gray-500">
                  No candidates match the current filters.
                </li>
              )}
            </ul>
            {privacy && <p className="mt-4 text-xs text-gray-400">{privacy}</p>}
            <p className="mt-2 text-xs text-gray-500">
              Note: author names were checked for co-authorship within the last 5
              years against the Intuitionist corpus ({authorNames.join(", ")}).
              Name-based matching may miss conflicts — editors remain responsible
              for final verification.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
