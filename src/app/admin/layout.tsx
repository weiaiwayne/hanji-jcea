import PortalShell from "@/components/PortalShell";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { EDITORIAL_SYSTEM_ENABLED } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!EDITORIAL_SYSTEM_ENABLED) notFound();
  const user = await requireUser("admin");
  return (
    <PortalShell
      user={user}
      title="Admin CMS"
      tabs={[
        { label: "Overview", href: "/admin", exact: true },
        { label: "Pages", href: "/admin/pages" },
        { label: "Issues & DOIs", href: "/admin/issues" },
        { label: "Editorial Board", href: "/admin/board" },
        { label: "AI Content", href: "/admin/ai" },
        { label: "Users", href: "/admin/users" },
        { label: "Settings", href: "/admin/settings" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
