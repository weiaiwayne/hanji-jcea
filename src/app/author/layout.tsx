import PortalShell from "@/components/PortalShell";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!EDITORIAL_SYSTEM_ENABLED) notFound();
  const user = await requireUser(); // any signed-in user can be an author
  return (
    <PortalShell
      user={user}
      title="Author Portal"
      tabs={[
        { label: "My Submissions", href: "/author", exact: true },
        { label: "New Submission", href: "/author/submit" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
