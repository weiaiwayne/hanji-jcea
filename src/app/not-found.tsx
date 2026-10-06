import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { getSettings } from "@/lib/db";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Shown for unknown URLs and for the shelved editorial-system routes, which
 * return 404 while EDITORIAL_SYSTEM_ENABLED is false. Carries the full public
 * chrome so a visitor arriving from a stale link or bookmark can navigate on.
 */
export default function NotFound() {
  const settings = getSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader user={null} />
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="font-serif text-6xl font-bold text-primary-200">404</p>
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-primary-900">
            Page not found
          </h1>
          <p className="mt-3 text-gray-600">
            The page you are looking for does not exist or is no longer
            available on this site.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
            >
              Journal home <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/current-issue"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-primary-900 transition-colors hover:bg-primary-50"
            >
              Current issue
            </Link>
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-primary-900 transition-colors hover:bg-primary-50"
            >
              Past issues
            </Link>
          </div>
          <p className="mt-10 text-sm text-gray-500">
            Looking for manuscript submission? See the{" "}
            <Link
              href="/submission"
              className="font-medium text-primary-700 underline underline-offset-4 hover:text-teal-700"
            >
              submission guidelines
            </Link>
            .
          </p>
        </div>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
