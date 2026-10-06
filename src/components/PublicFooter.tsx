import Link from "next/link";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

export default function PublicFooter({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const licenseName = settings.license_short || settings.license || "CC BY-NC-ND 4.0";
  const licenseUrl =
    settings.license_url || "https://creativecommons.org/licenses/by-nc-nd/4.0/";

  return (
    <footer className="hero-network mt-20 bg-primary-950 text-primary-200">
      <div aria-hidden="true" className="h-1 bg-gradient-to-r from-teal-500 via-primary-500 to-accent-500" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="flex items-center gap-2.5 font-serif text-lg font-bold text-white">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 font-serif text-sm ring-1 ring-white/15"
            >
              東亞
            </span>
            Journal of Contemporary Eastern Asia
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            An open-access, refereed journal publishing research on political,
            social, and economic trends in East and Southeast Asia.
          </p>
          <p className="mt-3 text-sm">
            ISSN {settings.issn || "2383-9449"} ·{" "}
            {settings.frequency || "Biannual (June and December)"}
          </p>
          <p className="mt-1 text-sm">
            Open access — free to read, with no subscription or reader charge.
          </p>
        </div>
        <nav aria-label="Footer — Journal">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-teal-500">
            Journal
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/about-journal">About the Journal</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/editorial-board">Editorial Board</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/current-issue">Current Issue</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/archive">Past Issues</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/best-paper">Best Paper Award</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer — Authors and reviewers">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-teal-500">
            Authors &amp; Reviewers
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/submission">Submission Guidelines</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/call-for-papers">Call for Papers</Link></li>
            {EDITORIAL_SYSTEM_ENABLED && (
              <>
                <li><Link className="hover:text-white hover:underline" href="/author">Author Portal</Link></li>
                <li><Link className="hover:text-white hover:underline" href="/reviewer">Reviewer Portal</Link></li>
              </>
            )}
            <li><Link className="hover:text-white hover:underline" href="/author-fees">Author Fees &amp; Waivers</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer — Policies">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-teal-500">
            Policies
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/editorial-process">Editorial Process &amp; Peer Review</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/publication-ethics">Publication Ethics</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/copyright">Copyright &amp; Licence</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/author-fees">Author Fees &amp; Business Model</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/archiving-and-preservation">Archiving &amp; Preservation</Link></li>
          </ul>
        </nav>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-teal-500">
            Contact
          </p>
          <ul className="space-y-2 text-sm">
            {settings.contact_email && (
              <li>
                <a className="hover:text-white hover:underline" href={`mailto:${settings.contact_email}`}>
                  {settings.contact_email}
                </a>
              </li>
            )}
            <li>{settings.publisher || "Cyber Emotions Research Center, Yeungnam University"}</li>
            <li>
              <a
                className="hover:text-white hover:underline"
                href="https://koreascience.or.kr/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Articles hosted on KoreaScience
              </a>
            </li>
            <li>Website hosted and maintained by Boston-based AI scholarly agents</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 bg-white/[0.03]">
        <div
          role="note"
          aria-label="AI disclosure"
          className="mx-auto max-w-6xl px-4 py-4 text-xs leading-relaxed text-primary-200"
        >
          <p>
            <span className="font-semibold text-white">AI disclosure — </span>
            This website and its content management system are built and managed
            by AI agents under human supervision.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-primary-300">
          <p>
            © {new Date().getFullYear()} Journal of Contemporary Eastern Asia.
            Articles © the author(s), licensed under{" "}
            <a
              className="underline hover:text-white"
              href={licenseUrl}
              target="_blank"
              rel="license noopener noreferrer"
            >
              {licenseName}
            </a>
            .
          </p>
          <p>
            <a
              className="hover:text-white hover:underline"
              href="https://publicationethics.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Member of COPE
            </a>{" "}
            · Follows CONSORT and TOP guidelines
          </p>
        </div>
      </div>
    </footer>
  );
}
