"use client";

import { useState } from "react";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/basePath";
const CATEGORIES = [
  "Politics & International Relations",
  "Society & Culture",
  "Economy & Development",
  "Media & Communication",
  "Internet Research",
  "Social Network Analysis",
  "Triple Helix & Innovation Studies",
  "Cyber Communication",
  "Other",
];

const STEPS = ["Metadata", "Authors", "Cover Letter", "Files", "Review & Submit"];

interface AuthorEntry {
  name: string;
  email: string;
  affiliation: string;
  country: string;
  orcid: string;
}

interface RecommendedReviewer {
  name: string;
  affiliation: string;
  email: string;
  reason: string;
}

export default function SubmissionWizard() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Step 1
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  // Step 2
  const [authors, setAuthors] = useState<AuthorEntry[]>([
    { name: "", email: "", affiliation: "", country: "", orcid: "" },
  ]);
  const [corresponding, setCorresponding] = useState(0);

  // Step 3
  const [coverLetter, setCoverLetter] = useState("");
  const [reviewers, setReviewers] = useState<RecommendedReviewer[]>([
    { name: "", affiliation: "", email: "", reason: "" },
    { name: "", affiliation: "", email: "", reason: "" },
    { name: "", affiliation: "", email: "", reason: "" },
  ]);

  // Step 4
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [suppFiles, setSuppFiles] = useState<File[]>([]);

  // Step 5
  const [checklist, setChecklist] = useState({
    plagiarism: false,
    ethics: false,
    funding: false,
    original: false,
  });
  const [funding, setFunding] = useState("");
  const [consent, setConsent] = useState({ podcast: false, summary: false, viz: false });

  function validateStep(s: number): string {
    if (s === 0) {
      if (title.trim().length < 5) return "Please enter the manuscript title.";
      if (abstract.trim().length < 100)
        return "Please provide an abstract (at least 100 characters).";
      if (keywords.split(",").map((k) => k.trim()).filter(Boolean).length < 3)
        return "Please provide at least 3 keywords, separated by commas.";
      if (categories.length === 0) return "Select at least one subject category.";
    }
    if (s === 1) {
      if (authors.some((a) => !a.name.trim() || !a.affiliation.trim()))
        return "Each author needs a name and affiliation.";
      if (!authors[corresponding]?.email.trim())
        return "The corresponding author needs an email address.";
    }
    if (s === 2) {
      if (coverLetter.trim().length < 50)
        return "Please write a cover letter addressed to the Editor-in-Chief.";
      const complete = reviewers.filter(
        (r) => r.name.trim() && r.affiliation.trim() && r.reason.trim()
      );
      if (complete.length < 3)
        return "JCEA requires 3 recommended reviewers, each with name, affiliation, and a reason for the recommendation.";
    }
    if (s === 3) {
      if (!manuscriptFile) return "Please upload the manuscript PDF.";
      if (manuscriptFile && !/\.pdf$/i.test(manuscriptFile.name))
        return "The manuscript must be a PDF file.";
    }
    if (s === 4) {
      if (!checklist.plagiarism || !checklist.ethics || !checklist.original)
        return "Please confirm all required checklist items.";
    }
    return "";
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  async function submit(asDraft: boolean) {
    if (!asDraft) {
      const err = validateStep(4);
      if (err) {
        setError(err);
        return;
      }
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append(
      "payload",
      JSON.stringify({
        draft: asDraft,
        title,
        abstract,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        categories,
        authors: authors.map((a, i) => ({ ...a, is_corresponding: i === corresponding })),
        cover_letter: coverLetter,
        recommended_reviewers: reviewers.filter((r) => r.name.trim()),
        checklist,
        funding,
        consent,
      })
    );
    if (manuscriptFile) fd.append("manuscript", manuscriptFile);
    for (const f of suppFiles) fd.append("supplementary", f);

    const res = await fetch(api("/api/submissions"), { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = api(`/author/submissions/${data.id}?created=1`);
    } else {
      setError(data.error || "Submission failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <div className="mb-8" aria-label="Submission steps">
        <div
          className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-primary-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                aria-current={i === step ? "step" : undefined}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 transition-colors ${
                  i < step
                    ? "bg-teal-500 text-white ring-teal-200"
                    : i === step
                      ? "bg-primary-700 text-white ring-primary-200"
                      : "bg-white text-gray-500 ring-gray-200"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={
                  i === step
                    ? "font-semibold text-primary-900"
                    : i < step
                      ? "text-teal-700"
                      : "text-gray-400"
                }
              >
                {s}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="title" className={labelCls}>
                Manuscript title *
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="abstract" className={labelCls}>
                Abstract * <span className="font-normal text-gray-500">({abstract.length} characters — max 250 words recommended)</span>
              </label>
              <textarea
                id="abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                rows={8}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="keywords" className={labelCls}>
                Keywords * <span className="font-normal text-gray-500">(3–6, comma-separated)</span>
              </label>
              <input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. social network analysis, South Korea, political communication"
                className={inputCls}
              />
            </div>
            <fieldset>
              <legend className={labelCls}>JCEA subject categories *</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={categories.includes(c)}
                      onChange={(e) =>
                        setCategories(
                          e.target.checked
                            ? [...categories, c]
                            : categories.filter((x) => x !== c)
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary-700"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              List all authors in order. Select the corresponding author — review
              correspondence will be sent to them.
            </p>
            {authors.map((a, i) => (
              <fieldset key={i} className="rounded-md border border-gray-200 p-4">
                <legend className="flex w-full items-center justify-between px-1 text-sm font-semibold text-gray-800">
                  <span>Author {i + 1}</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Full name *</label>
                    <input
                      value={a.name}
                      onChange={(e) =>
                        setAuthors(authors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email {i === corresponding && "*"}</label>
                    <input
                      type="email"
                      value={a.email}
                      onChange={(e) =>
                        setAuthors(authors.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Affiliation *</label>
                    <input
                      value={a.affiliation}
                      onChange={(e) =>
                        setAuthors(
                          authors.map((x, j) => (j === i ? { ...x, affiliation: e.target.value } : x))
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Country</label>
                      <input
                        value={a.country}
                        onChange={(e) =>
                          setAuthors(
                            authors.map((x, j) => (j === i ? { ...x, country: e.target.value } : x))
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>ORCID</label>
                      <input
                        value={a.orcid}
                        onChange={(e) =>
                          setAuthors(
                            authors.map((x, j) => (j === i ? { ...x, orcid: e.target.value } : x))
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="corresponding"
                      checked={corresponding === i}
                      onChange={() => setCorresponding(i)}
                      className="h-4 w-4 border-gray-300 text-primary-700"
                    />
                    Corresponding author
                  </label>
                  {authors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthors(authors.filter((_, j) => j !== i));
                        if (corresponding >= i && corresponding > 0)
                          setCorresponding(corresponding - 1);
                      }}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
                    </button>
                  )}
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              onClick={() =>
                setAuthors([...authors, { name: "", email: "", affiliation: "", country: "", orcid: "" }])
              }
              className={btnSecondary}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Co-Author
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="cover" className={labelCls}>
                Cover letter to the Editor-in-Chief *
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Briefly describe the contribution and its fit with JCEA&apos;s scope.
              </p>
              <textarea
                id="cover"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={8}
                className={inputCls}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Three recommended reviewers *
              </p>
              <p className="mt-1 text-xs text-gray-500">
                JCEA policy requires every cover letter to name three experts in
                your field, with affiliations and the reason each is qualified to
                review this manuscript. Recommended reviewers must not be recent
                co-authors or colleagues at your institution.
              </p>
              {reviewers.map((r, i) => (
                <fieldset key={i} className="mt-3 rounded-md border border-gray-200 p-4">
                  <legend className="px-1 text-sm font-semibold text-gray-800">
                    Recommended reviewer {i + 1}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className={labelCls}>Name *</label>
                      <input
                        value={r.name}
                        onChange={(e) =>
                          setReviewers(reviewers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Affiliation *</label>
                      <input
                        value={r.affiliation}
                        onChange={(e) =>
                          setReviewers(
                            reviewers.map((x, j) => (j === i ? { ...x, affiliation: e.target.value } : x))
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input
                        type="email"
                        value={r.email}
                        onChange={(e) =>
                          setReviewers(reviewers.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelCls}>Why is this person qualified? *</label>
                    <input
                      value={r.reason}
                      onChange={(e) =>
                        setReviewers(reviewers.map((x, j) => (j === i ? { ...x, reason: e.target.value } : x)))
                      }
                      className={inputCls}
                      placeholder="e.g. Published extensively on East Asian digital politics"
                    />
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="ms-file" className={labelCls}>
                Manuscript PDF * <span className="font-normal text-gray-500">(anonymized for single-blind review)</span>
              </label>
              <input
                id="ms-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setManuscriptFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-600"
              />
              {manuscriptFile && (
                <p className="mt-2 text-sm text-teal-700">
                  Selected: {manuscriptFile.name} ({(manuscriptFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
            <div>
              <label htmlFor="supp-files" className={labelCls}>
                Supplementary files <span className="font-normal text-gray-500">(optional — data, appendices, figures)</span>
              </label>
              <input
                id="supp-files"
                type="file"
                multiple
                onChange={(e) => setSuppFiles([...(e.target.files ?? [])])}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-300"
              />
              {suppFiles.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  {suppFiles.map((f) => (
                    <li key={f.name}>{f.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <section className="rounded-md bg-gray-50 p-4 text-sm">
              <h3 className="font-semibold text-gray-900">Summary</h3>
              <dl className="mt-2 space-y-1 text-gray-700">
                <div><dt className="inline font-medium">Title: </dt><dd className="inline">{title}</dd></div>
                <div><dt className="inline font-medium">Authors: </dt><dd className="inline">{authors.map((a) => a.name).join(", ")}</dd></div>
                <div><dt className="inline font-medium">Categories: </dt><dd className="inline">{categories.join("; ")}</dd></div>
                <div><dt className="inline font-medium">Files: </dt><dd className="inline">{manuscriptFile?.name}{suppFiles.length > 0 ? ` + ${suppFiles.length} supplementary` : ""}</dd></div>
                <div><dt className="inline font-medium">Recommended reviewers: </dt><dd className="inline">{reviewers.filter((r) => r.name).map((r) => r.name).join(", ")}</dd></div>
              </dl>
            </section>

            <fieldset>
              <legend className="text-sm font-semibold text-gray-800">Submission checklist *</legend>
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checklist.original}
                    onChange={(e) => setChecklist({ ...checklist, original: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-700"
                  />
                  This manuscript is original, unpublished, and not under consideration elsewhere.
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checklist.plagiarism}
                    onChange={(e) => setChecklist({ ...checklist, plagiarism: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-700"
                  />
                  A plagiarism check has been performed on this manuscript.
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checklist.ethics}
                    onChange={(e) => setChecklist({ ...checklist, ethics: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-700"
                  />
                  The research complies with applicable ethics requirements (COPE, and where relevant CONSORT/TOP guidelines).
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checklist.funding}
                    onChange={(e) => setChecklist({ ...checklist, funding: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-700"
                  />
                  Funding sources have been disclosed below (check even if there is no funding).
                </label>
              </div>
              <div className="mt-3">
                <label htmlFor="funding" className={labelCls}>
                  Funding disclosure
                </label>
                <input
                  id="funding"
                  value={funding}
                  onChange={(e) => setFunding(e.target.value)}
                  placeholder='e.g. "National Research Foundation of Korea grant NRF-…" or "No funding received"'
                  className={inputCls}
                />
              </div>
            </fieldset>

            <fieldset className="rounded-md border border-teal-100 bg-teal-50/50 p-4">
              <legend className="px-1 text-sm font-semibold text-teal-700">
                Optional AI features (your choice)
              </legend>
              <p className="text-xs text-gray-600">
                If your paper is published, JCEA can generate AI-assisted
                companion content. These are strictly opt-in, require editorial
                approval before publication, and can be withdrawn at any time.
              </p>
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={consent.podcast}
                    onChange={(e) => setConsent({ ...consent, podcast: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600"
                  />
                  I consent to an AI-generated audio podcast summarizing my paper.
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={consent.summary}
                    onChange={(e) => setConsent({ ...consent, summary: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600"
                  />
                  I consent to an AI-generated plain-language summary.
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={consent.viz}
                    onChange={(e) => setConsent({ ...consent, viz: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600"
                  />
                  I consent to AI-generated visualizations derived from my paper.
                </label>
              </div>
            </fieldset>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setError("");
            setStep(Math.max(0, step - 1));
          }}
          disabled={step === 0 || busy}
          className={btnSecondary}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={busy || title.trim().length < 5}
            className={btnSecondary}
            title="Save your progress without submitting"
          >
            Save Draft
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} disabled={busy} className={btnPrimary}>
              Continue <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={busy}
              className={btnPrimary}
            >
              {busy ? "Submitting…" : "Submit Manuscript"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
