import { getSettings } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "@/components/ui";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireUser("admin");
  const settings = getSettings();
  return (
    <>
      <PageTitle
        title="Site Settings"
        subtitle="Journal metadata shown across the public site."
      />
      <SettingsForm initial={settings} />
    </>
  );
}
