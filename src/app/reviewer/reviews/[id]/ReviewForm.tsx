"use client";

import { useState } from "react";
import { Card, CardHeader, btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";

import { api } from "@/lib/basePath";
const SCORES = [
  { key: "score_novelty", label: "Novelty" },
  { key: "score_rigor", label: "Methodological rigor" },
  { key: "score_significance", label: "Significance" },
  { key: "score_clarity", label: "Clarity of writing" },
] as const;

interface ReviewData {
  recommendation: string;
  comments_general: string;
  comments_sections: string;
  comments_confidential: string;
  score_novelty: number;
  score_rigor: number;
  score_significance: number;
  score_clarity: number;
  conflict_declared: boolean;
}

export default function ReviewForm({
  assignmentId,
  initial,
  readOnly,
}: {
  assignmentId: number;
  initial: ReviewData;
  readOnly: boolean;
}) {
  const [data, setData] = useState<ReviewData>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  async function save(submit: boolean) {
    if (submit) {
      if (!data.conflict_declared) {
        setError(
          "Please confirm the conflict-of-interest declaration before submitting."
        );
        return;
      }
      if (!data.recommendation) {
        setError("Please select an overall recommendation.");
        return;
      }
      if (
        SCORES.some((s) => !data[s.key] || data[s.key] < 1 || data[s.key] > 5)
      ) {
        setError("Please provide all four quality scores (1–5).");
        return;
      }
      if (data.comments_general.trim().length < 50) {
        setError("Please provide general comments for the authors (at least a few sentences).");
        return;
      }
    }
    setBusy(true);
    setError("");
    setSavedMsg("");
    const fd = new FormData();
    fd.append("payload", JSON.stringify({ ...data, submit }));
    if (file) fd.append("attachment", file);
    const res = await fetch(api(`/api/assignments/${assignmentId}/review`), {
      method: "POST",
      body: fd,
    });
    const resp = await res.json().catch(() => ({}));
    if (res.ok) {
      if (submit) window.location.reload();
      else {
        setSavedMsg("Draft saved.");
        setBusy(false);
        setTimeout(() => setSavedMsg(""), 2500);
      }
    } else {
      setError(resp.error || "Save failed");
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Structured Review"
        subtitle="Scores use the 1–5 scale (1 = poor, 5 = excellent), matching the Intuitionist virtual review format."
      />
      <div className="space-y-6 px-5 py-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <fieldset disabled={readOnly || busy} className="space-y-6">
          <div>
            <label htmlFor="recommendation" className={labelCls}>
              Overall recommendation *
            </label>
            <select
              id="recommendation"
              value={data.recommendation}
              onChange={(e) => setData({ ...data, recommendation: e.target.value })}
              className="w-full rounded-md border border-gray-300 py-2 pl-2 pr-8 text-sm shadow-sm"
            >
              <option value="">— Select —</option>
              <option value="accept">Accept</option>
              <option value="minor_revision">Minor Revision</option>
              <option value="major_revision">Major Revision</option>
              <option value="reject">Reject</option>
            </select>
          </div>

          <fieldset>
            <legend className={labelCls}>Quality scores (1–5) *</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {SCORES.map((s) => (
                <div key={s.key}>
                  <p className="text-sm text-gray-700">{s.label}</p>
                  <div
                    className="mt-1 flex gap-1"
                    role="radiogroup"
                    aria-label={`${s.label} score`}
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={data[s.key] === v}
                        onClick={() => setData({ ...data, [s.key]: v })}
                        className={`h-9 w-9 rounded-md border text-sm font-medium transition-colors ${
                          data[s.key] === v
                            ? "border-primary-700 bg-primary-700 text-white"
                            : "border-gray-300 bg-white text-gray-600 hover:bg-primary-50"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="comments-general" className={labelCls}>
              General comments to the authors *
            </label>
            <textarea
              id="comments-general"
              value={data.comments_general}
              onChange={(e) => setData({ ...data, comments_general: e.target.value })}
              rows={6}
              className={inputCls}
              placeholder="Overall assessment of the contribution, strengths, and main concerns…"
            />
          </div>

          <div>
            <label htmlFor="comments-sections" className={labelCls}>
              Specific comments by section
            </label>
            <textarea
              id="comments-sections"
              value={data.comments_sections}
              onChange={(e) => setData({ ...data, comments_sections: e.target.value })}
              rows={6}
              className={inputCls}
              placeholder={"Introduction: …\nMethods: …\nResults: …\nDiscussion: …"}
            />
          </div>

          <div>
            <label htmlFor="comments-confidential" className={labelCls}>
              Confidential comments to the editor{" "}
              <span className="font-normal text-gray-500">(not shown to authors)</span>
            </label>
            <textarea
              id="comments-confidential"
              value={data.comments_confidential}
              onChange={(e) => setData({ ...data, comments_confidential: e.target.value })}
              rows={3}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="attachment" className={labelCls}>
              Annotated manuscript{" "}
              <span className="font-normal text-gray-500">(optional PDF upload)</span>
            </label>
            <input
              id="attachment"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700"
            />
          </div>

          <label className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={data.conflict_declared}
              onChange={(e) => setData({ ...data, conflict_declared: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-700"
            />
            <span>
              <strong>Conflict of interest declaration *</strong> — I confirm that
              I have not co-authored with any of the manuscript authors in the
              last 5 years, and that I have no other conflicts of interest
              (institutional, financial, or personal) that would compromise an
              impartial review.
            </span>
          </label>
        </fieldset>

        {!readOnly && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => save(false)} disabled={busy} className={btnSecondary}>
              Save Draft
            </button>
            <button type="button" onClick={() => save(true)} disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : "Submit Review"}
            </button>
            <span className="text-xs text-teal-700" aria-live="polite">{savedMsg}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
