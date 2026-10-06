import PortalShell from "@/components/PortalShell";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!EDITORIAL_SYSTEM_ENABLED) notFound();
  const user = await requireUser("reviewer");
  return (
    <PortalShell
      user={user}
      title="Reviewer Portal"
      tabs={[{ label: "My Reviews", href: "/reviewer", exact: true }]}
    >
      {children}
    </PortalShell>
  );
}
