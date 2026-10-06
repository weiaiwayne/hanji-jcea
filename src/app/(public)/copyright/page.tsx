import CmsContent from "@/components/CmsContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Copyright & License" };

export default function Page() {
  return <CmsContent slug="copyright" fallbackTitle="Copyright & License" />;
}
