import Link from "next/link";
import type { ReactNode } from "react";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-primary-600 to-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-primary-800/40 hover:from-primary-500 hover:to-primary-600 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:border-primary-300 hover:bg-primary-50 active:translate-y-px disabled:opacity-50 transition-all";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50 transition-all";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors";
export const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-400 placeholder:text-gray-400";
export const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

const BADGE_DOTS: Record<string, string> = {
  teal: "bg-teal-500",
  amber: "bg-accent-500",
  red: "bg-red-500",
  blue: "bg-primary-500",
  gray: "bg-gray-400",
};

export function Badge({
  children,
  className = "bg-gray-100 text-gray-700",
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: keyof typeof BADGE_DOTS;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-black/[0.04] ${className}`}
    >
      {dot && (
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${BADGE_DOTS[dot]}`} />
      )}
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200/80 bg-white shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
      <div>
        <h2 className="font-serif text-[1.05rem] font-bold text-primary-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 font-serif text-lg font-bold text-primary-300"
      >
        ∅
      </span>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {hint && <p className="max-w-sm text-sm text-gray-500">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="font-serif text-[1.75rem] font-bold tracking-tight text-primary-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-gray-300">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="rounded hover:text-primary-700 hover:underline underline-offset-2"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-800" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
