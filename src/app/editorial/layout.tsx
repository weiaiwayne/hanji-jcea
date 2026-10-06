import PortalShell from "@/components/PortalShell";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function EditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!EDITORIAL_SYSTEM_ENABLED) notFound();
  const user = await requireUser("editor", "eic");
  return (
    <PortalShell
      user={user}
      title="Editorial Dashboard"
      tabs={[
        { label: "Manuscript Queue", href: "/editorial", exact: true },
        { label: "Issue Management", href: "/editorial/issues" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
