import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const settings = getSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader user={user ? { name: user.name, roles: user.roles } : null} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
}
