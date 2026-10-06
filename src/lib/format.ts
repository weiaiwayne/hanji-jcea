export const MS_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  revised: "Revised — Awaiting Decision",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  published: "Published",
};

export const MS_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-primary-100 text-primary-800",
  under_review: "bg-accent-100 text-accent-700",
  revision_requested: "bg-orange-100 text-orange-800",
  revised: "bg-primary-100 text-primary-800",
  accepted: "bg-teal-100 text-teal-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-500",
  published: "bg-teal-100 text-teal-700",
};

export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  invited: "Invited",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const RECOMMENDATION_LABELS: Record<string, string> = {
  accept: "Accept",
  minor_revision: "Minor Revision",
  major_revision: "Major Revision",
  reject: "Reject",
};

export const SENIORITY_LABELS: Record<string, string> = {
  emerging: "Emerging",
  "mid-career": "Mid-Career",
  senior: "Senior",
};

export const SENIORITY_COLORS: Record<string, string> = {
  emerging: "bg-teal-100 text-teal-700",
  "mid-career": "bg-primary-100 text-primary-700",
  senior: "bg-accent-100 text-accent-700",
};

/** Normalize SQLite ("YYYY-MM-DD HH:MM:SS", UTC) and ISO strings to a Date. */
function parseDate(iso: string): Date {
  let s = iso.includes(" ") ? iso.replace(" ", "T") : iso;
  // SQLite datetimes are UTC but carry no timezone marker — append one.
  if (s.includes("T") && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += "Z";
  return new Date(s);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseDate(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseDate(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = parseDate(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}
